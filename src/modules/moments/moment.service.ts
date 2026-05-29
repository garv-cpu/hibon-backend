import { Friendship } from "../../database/models/Friendship.model.js";

import { Moment } from "../../database/models/Moment.model.js";
import { Reaction } from "../../database/models/Reaction.model.js";
import { Comment } from "../../database/models/Comment.model.js";

import { User } from "../../database/models/User.model.js";

import { Prompt } from "../../database/models/Prompt.model.js";

import { ApiError } from "../../utils/ApiError.js";

import { isSameDay } from "./helpers/date.helper.js";

import { calculateStreak } from "./helpers/streak.helper.js";
import {
  cleanupExpiredMoments,
  deleteMomentsCascade,
  getMomentExpiryCutoff
} from "./moment.expiry.js";

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

    const now = new Date();
    const timezone =
      user.timezone || "UTC";
    const alreadyPostedToday =
      Boolean(
        user.lastMomentDate &&
          isSameDay(
            user.lastMomentDate,
            now,
            timezone
          )
      );

    if (alreadyPostedToday) {
      throw new ApiError(
        409,
        "Today's bon moment is already saved"
      );
    }

    const activeMoments =
      await Moment.find({
        user: userId,
        createdAt: {
          $gte: getMomentExpiryCutoff()
        }
      })
        .select("_id")
        .lean();

    await deleteMomentsCascade(
      activeMoments.map(
        (moment) => moment._id
      )
    );

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
      alreadyPostedToday
        ? user.currentStreak
        : calculateStreak(
            user.lastMomentDate,
            user.currentStreak,
            timezone
          );

    user.currentStreak = newStreak;

    if (
      newStreak >
      user.longestStreak
    ) {
      user.longestStreak =
        newStreak;
    }

    user.lastMomentDate = now;

    await user.save();

    return moment;
  }

  static async getFeed(
    userId: string
  ) {
    const currentUser =
      await User.findById(userId)
        .select("blockedUsers")
        .lean();

    const blockedByMe =
      (currentUser?.blockedUsers || [])
        .map((id: any) => id.toString());

    const blockedMeUsers =
      await User.find({
        blockedUsers: userId
      })
        .select("_id")
        .lean();

    const hiddenUserIds =
      new Set<string>([
        ...blockedByMe,
        ...blockedMeUsers.map((user) =>
          user._id.toString()
        )
      ]);

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
      )
      .filter(
        (id: any) =>
          !hiddenUserIds.has(
            id.toString()
          )
      );

    const moments =
      await Moment.find({
      createdAt: {
        $gte: getMomentExpiryCutoff()
      },
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
            "username name avatar avatarEmoji"
          )
          .lean(),

        Comment.find({
          moment: {
            $in: momentIds
          }
        })
          .populate(
            "user",
            "username name avatar avatarEmoji"
          )
          .sort({
            createdAt: 1
          })
          .lean()
      ]);

    return moments.map((moment) => {
      const momentId =
        moment._id.toString();
      const momentObject =
        moment.toObject();

      return {
        ...momentObject,
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

  static async getMomentById(
    userId: string,
    momentId: string
  ) {
    const moment =
      await Moment.findOne({
        _id: momentId,
        createdAt: {
          $gte: getMomentExpiryCutoff()
        }
      })
        .populate(
          "user",
          "username name avatar avatarEmoji currentStreak"
        )
        .lean();

    if (!moment) {
      throw new ApiError(
        404,
        "Moment not found"
      );
    }

    const ownerId =
      (moment.user as any)?._id?.toString?.() ||
      moment.user?.toString();

    const isOwner = ownerId === userId;
    const areFriends =
      isOwner ||
      Boolean(
        await Friendship.findOne({
          status: "accepted",
          $or: [
            {
              requester: userId,
              recipient: ownerId
            },
            {
              requester: ownerId,
              recipient: userId
            }
          ]
        })
          .select("_id")
          .lean()
      );

    if (!areFriends) {
      throw new ApiError(
        403,
        "Moment is private"
      );
    }

    const reactions =
      await Reaction.find({
        moment: moment._id
      })
        .populate(
          "user",
          "username name avatar avatarEmoji"
        )
        .lean();

    return {
      ...moment,
      reactions,
      prompt: moment.promptText
        ? {
            text: moment.promptText
          }
        : null,
      loggedDate: moment.createdAt
    };
  }
}
