import { Reaction } from "../../database/models/Reaction.model.js";

import { Moment } from "../../database/models/Moment.model.js";

import { ApiError } from "../../utils/ApiError.js";

import { NotificationService } from "../notifications/notification.service.js";

import { getIO } from "../../sockets/socket.server.js";

export class ReactionService {
    static async reactToMoment(
        userId: string,
        momentId: string,
        emoji: string
    ) {
        const moment =
            await Moment.findById(
                momentId
            );

        if (!moment) {
            throw new ApiError(
                404,
                "Moment not found"
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

        if (
            moment.user.toString() !==
            userId
        ) {
            await NotificationService.createNotification(
                {
                    recipient:
                        moment.user.toString(),

                    sender: userId,

                    type: "reaction",

                    title:
                        "New Reaction",

                    message:
                        "Someone reacted to your moment"
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