import { Friendship } from "../../database/models/Friendship.model.js";
import { Moment } from "../../database/models/Moment.model.js";

import { User } from "../../database/models/User.model.js";

import { ApiError } from "../../utils/ApiError.js";

import { isSameDay } from "./helpers/date.helper.js";

import { calculateStreak } from "./helpers/streak.helper.js";

interface CreateMomentInput {
    text: string;
    emoji: string;
}

export class MomentService {
    static async createMoment(
        userId: string,
        data: CreateMomentInput
    ) {
        const user =
            await User.findById(userId);

        if (!user) {
            throw new ApiError(
                404,
                "User not found"
            );
        }

        if (
            user.lastMomentDate &&
            isSameDay(
                user.lastMomentDate,
                new Date()
            )
        ) {
            throw new ApiError(
                400,
                "You already posted today"
            );
        }

        const moment =
            await Moment.create({
                user: userId,
                text: data.text,
                emoji: data.emoji
            });

        const newStreak =
            calculateStreak(
                user.lastMomentDate,
                user.currentStreak
            );

        user.currentStreak = newStreak;

        if (
            newStreak >
            user.longestStreak
        ) {
            user.longestStreak =
                newStreak;
        }

        user.lastMomentDate =
            new Date();

        await user.save();

        return moment;
    }

    static async getFeed(
        userId: string
    ) {
        const friendships =
            await Friendship.find({
                status: "accepted",

                $or: [
                    { requester: userId },
                    { recipient: userId }
                ]
            });

        const friendIds =
            friendships.map((friendship: { requester: { toString: () => string; }; recipient: any; }) => {
                if (
                    friendship.requester.toString() ===
                    userId
                ) {
                    return friendship.recipient;
                }

                return friendship.requester;
            });

        return await Moment.find({
            user: {
                $in: [
                    ...friendIds,
                    userId
                ]
            }
        })
            .populate(
                "user",
                "username avatar currentStreak"
            )

            .sort({
                createdAt: -1
            })

            .limit(50);
    }
}