import { Comment } from "../../database/models/Comment.model.js";
import { Friendship } from "../../database/models/Friendship.model.js";
import { Moment } from "../../database/models/Moment.model.js";
import { User } from "../../database/models/User.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { getIO } from "../../sockets/socket.server.js";
import { NotificationService } from "../notifications/notification.service.js";
import { sendPushToUser } from "../../lib/pushNotifications.js";
import {
  cleanupExpiredMoments,
  getMomentExpiryCutoff
} from "../moments/moment.expiry.js";

const extractMentionedUsernames =
  (text: string) =>
    Array.from(
      new Set(
        (text.match(/(^|[\s.,!?()[\]{}'"“”‘’])@([a-z0-9_]{3,30})/gi) || [])
          .map((match) =>
            match
              .replace(/^[^@]*/, "")
              .slice(1)
              .toLowerCase()
          )
      )
    );

export class CommentService {
  static async createComment(
    userId: string,
    momentId: string,
    text: string
  ) {
    await cleanupExpiredMoments();

    const moment =
      await Moment.findById(momentId)
        .populate(
          "user",
          "username notificationPreferences"
        );

    if (
      !moment ||
      moment.createdAt <
        getMomentExpiryCutoff()
    ) {
      throw new ApiError(
        404,
        "Moment not found"
      );
    }

    const comment =
      await Comment.create({
        user: userId,
        moment: momentId,
        text
      });

    moment.commentsCount += 1;
    await moment.save();

    const populatedComment =
      await Comment.findById(comment._id)
      .populate(
        "user",
        "username name avatar avatarEmoji"
      )
      .lean();

    if (populatedComment) {
      getIO()
        .to(`moment:${momentId}`)
        .emit(
          "comment:new",
          {
            momentId,
            comment: populatedComment
          }
        );
    }

    const owner: any = moment.user;
    const ownerId =
      owner?._id?.toString?.() ||
      owner?.toString?.();
    const commenter =
      await User.findById(userId)
        .select("username avatar avatarEmoji")
        .lean();

    if (
      ownerId &&
      ownerId !== userId
    ) {
      await NotificationService.createNotification({
        recipient: ownerId,
        sender: userId,
        type: "comment",
        title: "New comment",
        message: `@${commenter?.username} commented on your moment`,
        entityId: momentId
      });

      if (
        owner?.notificationPreferences
          ?.reactions !== false
      ) {
        await sendPushToUser(
          ownerId,
          {
            title: "New comment",
            body: `@${commenter?.username} commented on your moment`,
            data: {
              type: "comment",
              momentId
            }
          }
        );
      }
    }

    const mentionedUsernames =
      extractMentionedUsernames(text);

    if (mentionedUsernames.length > 0) {
      const mentionedUsers =
        await User.find({
          username: {
            $in: mentionedUsernames
          }
        })
          .select("username notificationPreferences")
          .lean();

      await Promise.all(
        mentionedUsers.map(async (mentionedUser) => {
          const mentionedUserId =
            mentionedUser._id.toString();

          if (
            mentionedUserId === userId ||
            mentionedUserId === ownerId
          ) {
            return;
          }

          const canViewMoment =
            Boolean(
              await Friendship.findOne({
                status: "accepted",
                $or: [
                  {
                    requester: mentionedUserId,
                    recipient: ownerId
                  },
                  {
                    requester: ownerId,
                    recipient: mentionedUserId
                  }
                ]
              })
                .select("_id")
                .lean()
            );

          if (!canViewMoment) {
            return;
          }

          await NotificationService.createNotification({
            recipient: mentionedUserId,
            sender: userId,
            type: "mention",
            title: "You were mentioned",
            message: `@${commenter?.username} mentioned you in a comment`,
            entityId: momentId
          });

          if (
            mentionedUser.notificationPreferences
              ?.reactions !== false
          ) {
            await sendPushToUser(
              mentionedUserId,
              {
                title: "You were mentioned",
                body: `@${commenter?.username} mentioned you in a comment`,
                data: {
                  type: "mention",
                  momentId
                }
              }
            );
          }
        })
      );
    }

    return populatedComment;
  }

  static async getMomentComments(
    momentId: string
  ) {
    const moment =
      await Moment.findOne({
        _id: momentId,
        createdAt: {
          $gte: getMomentExpiryCutoff()
        }
      })
        .select("_id")
        .lean();

    if (!moment) {
      throw new ApiError(
        404,
        "Moment not found"
      );
    }

    return Comment.find({
      moment: momentId
    })
      .populate(
        "user",
        "username name avatar avatarEmoji"
      )
      .sort({
        createdAt: 1
      })
      .lean();
  }
}
