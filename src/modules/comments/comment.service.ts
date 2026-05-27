import { Comment } from "../../database/models/Comment.model.js";
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

    if (
      ownerId &&
      ownerId !== userId
    ) {
      const commenter =
        await User.findById(userId)
          .select("username avatar avatarEmoji")
          .lean();

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
            body: `@${commenter?.username}: ${text.slice(0, 90)}`,
            data: {
              type: "comment",
              momentId
            }
          }
        );
      }
    }

    return populatedComment;
  }

  static async getMomentComments(
    momentId: string
  ) {
    await cleanupExpiredMoments();

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
