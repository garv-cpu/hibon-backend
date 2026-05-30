import mongoose from "mongoose";

import { HiMessage } from "../../database/models/HiMessage.model.js";
import { User } from "../../database/models/User.model.js";
import { FriendshipService } from "../friendships/friendship.service.js";
import { NotificationService } from "../notifications/notification.service.js";
import { sendPushToUser } from "../../lib/pushNotifications.js";
import { getIO } from "../../sockets/socket.server.js";
import { onlineUsers } from "../../sockets/onlineUsers.js";
import { ApiError } from "../../utils/ApiError.js";

const MESSAGE_LIFETIME_MS =
  24 * 60 * 60 * 1000;

const previewText = (text: string) =>
  text.length > 70
    ? `${text.slice(0, 67).trim()}...`
    : text;

const shouldIncludeMessagePreview = () =>
  Math.random() < 0.35;

const sortParticipantIds = (
  firstUserId: string,
  secondUserId: string
) =>
  [firstUserId, secondUserId]
    .map((id) =>
      new mongoose.Types.ObjectId(id)
    )
    .sort((a, b) =>
      a.toString().localeCompare(b.toString())
    );

const cleanupExpiredMessages = () =>
  HiMessage.deleteMany({
    expiresAt: {
      $lte: new Date()
    }
  }).catch(() => undefined);

const serializeMessage = (
  message: any
) => ({
  _id: message._id.toString(),
  text: message.text,
  sender:
    typeof message.sender === "object"
      ? {
          _id: message.sender._id.toString(),
          username: message.sender.username,
          name: message.sender.name || message.sender.username,
          avatar: message.sender.avatar || "",
          avatarEmoji:
            message.sender.avatarEmoji || "🌸"
        }
      : message.sender.toString(),
  recipient:
    typeof message.recipient === "object"
      ? {
          _id: message.recipient._id.toString(),
          username: message.recipient.username,
          name:
            message.recipient.name ||
            message.recipient.username,
          avatar: message.recipient.avatar || "",
          avatarEmoji:
            message.recipient.avatarEmoji || "🌸"
        }
      : message.recipient.toString(),
  createdAt: message.createdAt,
  expiresAt: message.expiresAt,
  readAt: message.readAt || null
});

export class MessageService {
  static async getChats(userId: string) {
    await cleanupExpiredMessages();

    const messages =
      await HiMessage.find({
        participants: userId,
        expiresAt: {
          $gt: new Date()
        }
      })
        .populate(
          "sender",
          "username name avatar avatarEmoji"
        )
        .populate(
          "recipient",
          "username name avatar avatarEmoji"
        )
        .sort({
          createdAt: -1
        })
        .limit(300)
        .lean();

    const chats =
      new Map<string, any>();

    messages.forEach((message: any) => {
      const senderId =
        message.sender?._id?.toString();
      const recipientId =
        message.recipient?._id?.toString();
      const other =
        senderId === userId
          ? message.recipient
          : message.sender;
      const otherId =
        other?._id?.toString();

      if (!otherId || chats.has(otherId)) {
        return;
      }

      chats.set(otherId, {
        user: {
          _id: otherId,
          username: other.username,
          name: other.name || other.username,
          avatar: other.avatar || "",
          avatarEmoji:
            other.avatarEmoji || "🌸"
        },
        lastMessage: serializeMessage(message),
        unreadCount: messages.filter(
          (candidate: any) =>
            candidate.sender?._id?.toString() === otherId &&
            candidate.recipient?._id?.toString() === userId &&
            !candidate.readAt
        ).length
      });
    });

    return Array.from(chats.values());
  }

  static async getConversation(
    userId: string,
    otherUserId: string
  ) {
    await cleanupExpiredMessages();

    const areFriends =
      await FriendshipService.areFriends(
        userId,
        otherUserId
      );

    if (!areFriends) {
      throw new ApiError(
        403,
        "You can only message people in your circle"
      );
    }

    const participants =
      sortParticipantIds(userId, otherUserId);

    await HiMessage.updateMany(
      {
        sender: otherUserId,
        recipient: userId,
        readAt: null,
        expiresAt: {
          $gt: new Date()
        }
      },
      {
        $set: {
          readAt: new Date()
        }
      }
    );

    const messages =
      await HiMessage.find({
        participants: {
          $all: participants
        },
        expiresAt: {
          $gt: new Date()
        }
      })
        .populate(
          "sender",
          "username name avatar avatarEmoji"
        )
        .populate(
          "recipient",
          "username name avatar avatarEmoji"
        )
        .sort({
          createdAt: 1
        })
        .limit(120)
        .lean();

    return messages.map(serializeMessage);
  }

  static async sendMessage(
    senderId: string,
    recipientId: string,
    text: string
  ) {
    const cleanText =
      text.trim();

    if (!cleanText) {
      throw new ApiError(
        400,
        "Message cannot be empty"
      );
    }

    if (senderId === recipientId) {
      throw new ApiError(
        400,
        "You cannot message yourself"
      );
    }

    const areFriends =
      await FriendshipService.areFriends(
        senderId,
        recipientId
      );

    if (!areFriends) {
      throw new ApiError(
        403,
        "You can only message people in your circle"
      );
    }

    const [sender, recipient] =
      await Promise.all([
        User.findById(senderId)
          .select("username name avatar avatarEmoji")
          .lean(),
        User.findById(recipientId)
          .select("notificationPreferences")
          .lean()
      ]);

    if (!sender || !recipient) {
      throw new ApiError(
        404,
        "User not found"
      );
    }

    const message =
      await HiMessage.create({
        sender: senderId,
        recipient: recipientId,
        participants:
          sortParticipantIds(
            senderId,
            recipientId
          ),
        text: cleanText,
        expiresAt:
          new Date(
            Date.now() + MESSAGE_LIFETIME_MS
          )
      });

    const populated =
      await HiMessage.findById(message._id)
        .populate(
          "sender",
          "username name avatar avatarEmoji"
        )
        .populate(
          "recipient",
          "username name avatar avatarEmoji"
        )
        .lean();

    const serialized =
      serializeMessage(populated);

    await NotificationService.createNotification({
      recipient: recipientId,
      sender: senderId,
      type: "message",
      title: "New private message",
      message: shouldIncludeMessagePreview()
        ? `@${sender.username}: ${previewText(cleanText)}`
        : `@${sender.username} sent you a private message`,
      entityId: message._id.toString()
    });

    const socketId =
      onlineUsers.get(recipientId);

    if (socketId) {
      getIO()
        .to(socketId)
        .emit(
          "message:new",
          serialized
        );
    }

    await sendPushToUser(
      recipientId,
      {
        title: "New private message",
        body: shouldIncludeMessagePreview()
          ? `@${sender.username}: ${previewText(cleanText)}`
          : `@${sender.username} sent you a private message`,
        data: {
          type: "message",
          senderId,
          messageId:
            message._id.toString()
        }
      }
    );

    return serialized;
  }
}
