import { Friendship } from "../../database/models/Friendship.model.js";

import { Moment } from "../../database/models/Moment.model.js";
import { Reaction } from "../../database/models/Reaction.model.js";
import { Comment } from "../../database/models/Comment.model.js";

import { User } from "../../database/models/User.model.js";

import { Prompt } from "../../database/models/Prompt.model.js";

import { ApiError } from "../../utils/ApiError.js";

import { isSameDay } from "./helpers/date.helper.js";

import { calculateStreak } from "./helpers/streak.helper.js";

interface CreateMomentInput {
  text: string;
  emoji: string;
  promptId?: string;
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

    let promptDoc = null;

    if (data.promptId) {
      promptDoc =
        await Prompt.findById(
          data.promptId
        );
    }

    const moment =
      await Moment.create({
        user: userId,

        text: data.text,

        emoji: data.emoji,

        prompt: promptDoc?._id || null,

        promptText:
          promptDoc?.text || null,

        promptTitle:
          promptDoc?.title || null
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
      friendships.map(
        (friendship: any) => {
          if (
            friendship.requester.toString() ===
            userId
          ) {
            return friendship.recipient;
          }

          return friendship.requester;
        }
      );

    const moments =
      await Moment.find({
      user: {
        $in: [
          ...friendIds,
          userId
        ]
      }
    })
      .populate(
        "user",
        "username avatar avatarEmoji currentStreak"
      )

      .sort({
        createdAt: -1
      })

      .limit(50);

    const momentIds =
      moments.map((moment) => moment._id);

    const [reactions, comments] =
      await Promise.all([
        Reaction.find({
          moment: {
            $in: momentIds
          }
        })
          .populate(
            "user",
            "username name avatarEmoji"
          )
          .lean(),

        Comment.find({
          moment: {
            $in: momentIds
          }
        })
          .populate(
            "user",
            "username name avatarEmoji"
          )
          .sort({
            createdAt: 1
          })
          .lean()
      ]);

    return moments.map((moment) => {
      const momentId =
        moment._id.toString();

      return {
        ...moment.toObject(),
        reactions: reactions.filter(
          (reaction) =>
            reaction.moment.toString() ===
            momentId
        ),
        comments: comments.filter(
          (comment) =>
            comment.moment.toString() ===
            momentId
        )
      };
    });
  }
}
