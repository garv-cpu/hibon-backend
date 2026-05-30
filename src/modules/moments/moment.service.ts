import { Friendship } from "../../database/models/Friendship.model.js";

import { Moment } from "../../database/models/Moment.model.js";
import { Reaction } from "../../database/models/Reaction.model.js";
import { Comment } from "../../database/models/Comment.model.js";
import { MomentLog } from "../../database/models/MomentLog.model.js";
import { Reel } from "../../database/models/Reel.model.js";

import { User } from "../../database/models/User.model.js";

import { Prompt } from "../../database/models/Prompt.model.js";

import { ApiError } from "../../utils/ApiError.js";

import {
  daysBetweenCalendarDates,
  getDateKey,
  isSameDay
} from "./helpers/date.helper.js";

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

    const daysSinceLastMoment =
      user.lastMomentDate
        ? daysBetweenCalendarDates(
            user.lastMomentDate,
            now,
            timezone
          )
        : null;
    const freezesAvailable =
      user.streakFreezes ?? 0;
    const missedOneDay =
      daysSinceLastMoment === 2;
    const canUseFreeze =
      missedOneDay &&
      freezesAvailable > 0;
    const newStreak =
      !user.lastMomentDate
        ? 1
        : daysSinceLastMoment === 1 ||
            canUseFreeze
          ? (user.currentStreak || 0) + 1
          : 1;

    if (canUseFreeze) {
      user.streakFreezes =
        Math.max(
          freezesAvailable - 1,
          0
        );
      user.freezeHistory = [
        ...((user.freezeHistory || []) as any),
        {
          type: "used",
          streak:
            user.currentStreak || 0,
          date: now
        }
      ] as any;
    }

    const milestone =
      Math.floor(newStreak / 7) * 7;
    const lastAwarded =
      user.lastFreezeAwardedStreak || 0;

    if (
      milestone >= 7 &&
      milestone > lastAwarded &&
      !canUseFreeze
    ) {
      user.streakFreezes =
        (user.streakFreezes || 0) + 1;
      user.lastFreezeAwardedStreak =
        milestone;
      user.freezeHistory = [
        ...((user.freezeHistory || []) as any),
        {
          type: "earned",
          streak: milestone,
          date: now
        }
      ] as any;
    }

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

    await MomentLog.updateOne(
      {
        user: userId,
        loggedDateKey:
          getDateKey(
            now,
            timezone
          )
      },
      {
        $set: {
          moment: moment._id,
          text: moment.text,
          emoji: moment.emoji,
          loggedAt: now,
          timezone
        },
        $setOnInsert: {
          user: userId,
          loggedDateKey:
            getDateKey(
              now,
              timezone
            ),
          loggedAt: now
        }
      },
      {
        upsert: true
      }
    );

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

    const momentDate =
      new Date(moment.createdAt);
    const reel =
      await Reel.findOne({
        user: ownerId,
        month:
          momentDate.getMonth() + 1,
        year:
          momentDate.getFullYear()
      })
        .select("_id month year")
        .lean();

    return {
      ...moment,
      reactions,
      reelId:
        reel?._id?.toString?.() ||
        null,
      reel:
        reel
          ? {
              _id:
                reel._id.toString(),
              month: reel.month,
              year: reel.year
            }
          : null,
      prompt: moment.promptText
        ? {
            text: moment.promptText
          }
        : null,
      loggedDate: moment.createdAt
    };
  }
}
