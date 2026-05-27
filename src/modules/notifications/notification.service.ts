import Notification from "../../database/models/Notification.model.js";

import { getIO } from "../../sockets/socket.server.js";

import { onlineUsers } from "../../sockets/onlineUsers.js";

type NotificationType =
  | "reaction"
  | "friend_request"
  | "friend_accept"
  | "comment"
  | "nudge"
  | "moment"
  | "streak"
  | "reel";

export class NotificationService {
  static async createNotification({
    recipient,
    sender,
    type,
    title,
    message,
    entityId
  }: {
    recipient: string;
    sender?: string;
    type: NotificationType;
    title: string;
    message: string;
    entityId?: string;
  }) {

    // CREATE NOTIFICATION
    const notification =
      await Notification.create({
        recipient,
        sender,
        type,
        title,
        body: message,
        entityId
      });

    // POPULATE SENDER
    const populatedNotification =
      await Notification.findById(
        notification._id
      ).populate(
        "sender",
        "username name avatar avatarEmoji"
      );

    // REALTIME SOCKET
    const io = getIO();

    const socketId =
      onlineUsers.get(recipient);

    if (
      socketId &&
      populatedNotification
    ) {
      io.to(socketId).emit(
        "notification:new",
        populatedNotification
      );
    }

    return populatedNotification;
  }
}
