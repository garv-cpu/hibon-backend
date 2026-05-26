import { Reaction } from "../../database/models/Reaction.model.js";
import { Moment } from "../../database/models/Moment.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { NotificationService } from "../notifications/notification.service.js";
import { getIO } from "../../sockets/socket.server.js";
import { onlineUsers } from "../../sockets/onlineUsers.js";
import { User } from "../../database/models/User.model.js";
import { sendPushToUser } from "../../lib/pushNotifications.js";

export class ReactionService {
  static async reactToMoment(
    userId: string,
    momentId: string,
    emoji: string
  ) {

    const moment =
      await Moment.findById(momentId);

    if (!moment) {
      throw new ApiError(
        404,
        "Moment not found"
      );
    }

    if (
      moment.user.toString() === userId
    ) {
      throw new ApiError(
        400,
        "You cannot react to your own moment"
      );
    }

    const existingReaction =
      await Reaction.findOne({
        user: userId,
        moment: momentId
      });

    if (existingReaction) {
      existingReaction.emoji =
        emoji;

      await existingReaction.save();

      return existingReaction;
    }

    const reaction =
      await Reaction.create({
        user: userId,
        moment: momentId,
        emoji
      });

    moment.reactionsCount += 1;

    await moment.save();

    // CREATE REACTION NOTIFICATION
    if (
      moment.user.toString() !==
      userId
    ) {
      const reactor =
        await User.findById(userId).select(
          "username avatar avatarEmoji"
        );

      await NotificationService.createNotification({
        recipient:
          moment.user.toString(),

        sender: userId,

        type: "reaction",

        title: "New reaction",

        message: `reacted ${emoji} to your moment`,

        entityId: moment._id.toString()
      });

      const ownerId =
        moment.user.toString();

      const ownerSocket =
        onlineUsers.get(ownerId);

      const payload = {
        reactorUsername:
          reactor?.username,
        reactorAvatarEmoji:
          reactor?.avatarEmoji || "🌸",
        reactorAvatar:
          reactor?.avatar || "",
        emoji,
        momentId,
        momentPreview:
          moment.text.slice(0, 90)
      };

      if (ownerSocket) {
        getIO()
          .to(ownerSocket)
          .emit(
            "reaction_received",
            payload
          );
      }

      await sendPushToUser(
        ownerId,
        {
          title: `Someone reacted ${emoji}`,
          body: `@${reactor?.username} reacted to your moment`,
          data: {
            type: "reaction",
            momentId
          }
        }
      );
    }

    const io = getIO();

    io.emit("reaction:new", {
      momentId,
      emoji,
      userId
    });

    return reaction;
  }
}
