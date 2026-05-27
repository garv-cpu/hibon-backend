import { User } from "../../database/models/User.model.js";
import { Moment } from "../../database/models/Moment.model.js";
import { Reaction } from "../../database/models/Reaction.model.js";
import { Comment } from "../../database/models/Comment.model.js";
import { Friendship } from "../../database/models/Friendship.model.js";
import Notification from "../../database/models/Notification.model.js";
import { PushToken } from "../../database/models/PushToken.model.js";
import { Reel } from "../../database/models/Reel.model.js";
import { PlusWaitlist } from "../../database/models/PlusWaitlist.model.js";
import { ApiError } from "../../utils/ApiError.js";
import mongoose from "mongoose";
import {
  cleanupExpiredMoments,
  getMomentExpiryCutoff
} from "../moments/moment.expiry.js";

interface UpdateMeInput {
  name?: string;
  bio?: string;
  avatarEmoji?: string;
  avatar?: string;
  hasCompletedOnboarding?: boolean;
}

interface NotificationPreferencesInput {
  friendRequests?: boolean;
  reactions?: boolean;
  streakReminders?: boolean;
  reminderTime?: string;
  weeklyDigest?: boolean;
  momentPosted?: boolean;
}

interface PreferencesInput {
  theme?: "system" | "dark" | "light";
  accentColor?: string;
  fontScale?: number;
  language?: "en" | "hi" | "es";
}

interface PrivacyInput {
  profileVisibility?: "friends" | "private";
  showInSearch?: boolean;
  allowFriendRequests?: boolean;
}

const defaultNotificationPreferences = {
  friendRequests: true,
  reactions: true,
  streakReminders: true,
  reminderTime: "20:00",
  weeklyDigest: true,
  momentPosted: true
};

const defaultPreferences = {
  theme: "dark",
  accentColor: "#F5A623",
  fontScale: 1,
  language: "en"
};

const defaultPrivacy = {
  profileVisibility: "friends",
  showInSearch: true,
  allowFriendRequests: true
};

const toProfileResponse = async (userId: string) => {
  await cleanupExpiredMoments();

  const user =
    await User.findById(userId).lean();

  if (!user) {
    throw new ApiError(
      404,
      "User not found"
    );
  }

  const totalMoments =
    await Moment.countDocuments({
      user: userId,
      createdAt: {
        $gte: getMomentExpiryCutoff()
      }
    });

  return {
    _id: user._id.toString(),
    username: user.username,
    email: user.email,
    name: user.name || user.username,
    bio: user.bio || "",
    avatar: user.avatar || "",
    avatarEmoji:
      user.avatarEmoji || "🌸",
    currentStreak:
      user.currentStreak ?? 0,
    bestStreak:
      user.longestStreak ?? 0,
    longestStreak:
      user.longestStreak ?? 0,
    friendsCount:
      user.friendsCount ?? 0,
    totalMoments,
    hasCompletedOnboarding:
      user.hasCompletedOnboarding ?? true
  };
};

export class UserService {
  static async getMe(userId: string) {
    return toProfileResponse(userId);
  }

  static async updateMe(
    userId: string,
    data: UpdateMeInput
  ) {
    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          ...(data.name !== undefined && {
            name: data.name
          }),
          ...(data.bio !== undefined && {
            bio: data.bio
          }),
          ...(data.avatarEmoji !== undefined && {
            avatarEmoji: data.avatarEmoji
          }),
          ...(data.avatar !== undefined && {
            avatar: data.avatar
          }),
          ...(data.hasCompletedOnboarding !== undefined && {
            hasCompletedOnboarding:
              data.hasCompletedOnboarding
          })
        }
      },
      {
        runValidators: true
      }
    );

    return toProfileResponse(userId);
  }

  static async getNotificationPreferences(
    userId: string
  ) {
    const user =
      await User.findById(userId)
        .select("notificationPreferences")
        .lean();

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return {
      ...defaultNotificationPreferences,
      ...(user.notificationPreferences || {})
    };
  }

  static async updateNotificationPreferences(
    userId: string,
    data: NotificationPreferencesInput
  ) {
    const $set = Object.fromEntries(
      Object.entries(data).map(
        ([key, value]) => [
          `notificationPreferences.${key}`,
          value
        ]
      )
    );

    await User.findByIdAndUpdate(
      userId,
      { $set },
      { runValidators: true }
    );

    return this.getNotificationPreferences(userId);
  }

  static async getPreferences(
    userId: string
  ) {
    const user =
      await User.findById(userId)
        .select("preferences")
        .lean();

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return {
      ...defaultPreferences,
      ...(user.preferences || {})
    };
  }

  static async updatePreferences(
    userId: string,
    data: PreferencesInput
  ) {
    const $set = Object.fromEntries(
      Object.entries(data).map(
        ([key, value]) => [
          `preferences.${key}`,
          value
        ]
      )
    );

    await User.findByIdAndUpdate(
      userId,
      { $set },
      { runValidators: true }
    );

    return this.getPreferences(userId);
  }

  static async getPrivacy(
    userId: string
  ) {
    const user =
      await User.findById(userId)
        .select("privacy")
        .lean();

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return {
      ...defaultPrivacy,
      ...(user.privacy || {})
    };
  }

  static async updatePrivacy(
    userId: string,
    data: PrivacyInput
  ) {
    const $set = Object.fromEntries(
      Object.entries(data).map(
        ([key, value]) => [
          `privacy.${key}`,
          value
        ]
      )
    );

    await User.findByIdAndUpdate(
      userId,
      { $set },
      { runValidators: true }
    );

    return this.getPrivacy(userId);
  }

  static async getBlockedUsers(
    userId: string
  ) {
    const user =
      await User.findById(userId)
        .populate(
          "blockedUsers",
          "username name avatar avatarEmoji"
        )
        .lean();

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return user.blockedUsers || [];
  }

  static async unblockUser(
    userId: string,
    blockedUserId: string
  ) {
    await User.findByIdAndUpdate(
      userId,
      {
        $pull: {
          blockedUsers:
            blockedUserId
        }
      }
    );

    return this.getBlockedUsers(userId);
  }

  static async blockUser(
    userId: string,
    blockedUserId: string
  ) {
    if (userId === blockedUserId) {
      throw new ApiError(
        400,
        "You cannot block yourself"
      );
    }

    const target =
      await User.findById(blockedUserId)
        .select("_id")
        .lean();

    if (!target) {
      throw new ApiError(
        404,
        "User not found"
      );
    }

    await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: {
          blockedUsers:
            blockedUserId
        }
      }
    );

    return this.getBlockedUsers(userId);
  }

  static async joinPlusWaitlist(
    userId: string
  ) {
    await PlusWaitlist.updateOne(
      { userId },
      { $setOnInsert: { userId } },
      { upsert: true }
    );

    return {
      joined: true
    };
  }

  static async deleteMe(
    userId: string
  ) {
    const session =
      await mongoose.startSession();

    try {
      await session.withTransaction(
        async () => {
          const moments =
            await Moment.find({
              user: userId
            })
              .select("_id")
              .session(session)
              .lean();

          const momentIds =
            moments.map(
              (moment) => moment._id
            );

          await Promise.all([
            Comment.deleteMany({
              $or: [
                { user: userId },
                {
                  moment: {
                    $in: momentIds
                  }
                }
              ]
            }).session(session),
            Reaction.deleteMany({
              $or: [
                { user: userId },
                {
                  moment: {
                    $in: momentIds
                  }
                }
              ]
            }).session(session),
            Moment.deleteMany({
              user: userId
            }).session(session),
            Friendship.deleteMany({
              $or: [
                { requester: userId },
                { recipient: userId }
              ]
            }).session(session),
            Notification.deleteMany({
              $or: [
                { recipient: userId },
                { sender: userId }
              ]
            }).session(session),
            PushToken.deleteMany({
              userId
            }).session(session),
            Reel.deleteMany({
              user: userId
            }).session(session),
            PlusWaitlist.deleteMany({
              userId
            }).session(session),
            User.updateMany(
              {
                blockedUsers: userId
              },
              {
                $pull: {
                  blockedUsers: userId
                }
              }
            ).session(session),
            User.deleteOne({
              _id: userId
            }).session(session)
          ]);
        }
      );
    } finally {
      await session.endSession();
    }

    return {
      message: "Account deleted"
    };
  }

  static async getPublicProfile(
    viewerId: string,
    username: string
  ) {
    await cleanupExpiredMoments();

    const user =
      await User.findOne({
        username: username.toLowerCase()
      })
        .select(
          "username name bio avatar avatarEmoji currentStreak longestStreak friendsCount privacy"
        )
        .lean();

    if (!user) {
      throw new ApiError(
        404,
        "User not found"
      );
    }

    const targetId =
      user._id.toString();

    const friendship =
      await Friendship.findOne({
        $or: [
          {
            requester: viewerId,
            recipient: targetId
          },
          {
            requester: targetId,
            recipient: viewerId
          }
        ]
      })
        .select("requester recipient status")
        .lean();

    const isFriend =
      friendship?.status === "accepted";
    const hasPendingRequest =
      friendship?.status === "pending" &&
      friendship.requester.toString() === viewerId;
    const hasIncomingRequest =
      friendship?.status === "pending" &&
      friendship.recipient.toString() === viewerId;
    const canSeeMoments =
      isFriend ||
      targetId === viewerId;

    const totalMoments =
      await Moment.countDocuments({
        user: targetId,
        createdAt: {
          $gte: getMomentExpiryCutoff()
        }
      });

    const recentMoments =
      canSeeMoments
        ? await Moment.find({
            user: targetId,
            createdAt: {
              $gte: getMomentExpiryCutoff()
            }
          })
            .sort({
              createdAt: -1
            })
            .limit(5)
            .lean()
        : [];

    return {
      _id: targetId,
      username: user.username,
      name: user.name || user.username,
      bio: user.bio || "",
      avatar: user.avatar || "",
      avatarEmoji:
        user.avatarEmoji || "ðŸŒ¸",
      currentStreak:
        user.currentStreak ?? 0,
      bestStreak:
        canSeeMoments
          ? user.longestStreak ?? 0
          : 0,
      totalMoments: canSeeMoments
        ? totalMoments
        : 0,
      isFriend,
      hasPendingRequest,
      hasIncomingRequest,
      friendsCount:
        canSeeMoments
          ? user.friendsCount ?? 0
          : 0,
      isPrivate:
        user.privacy?.profileVisibility ===
          "private" && !isFriend,
      friendshipId:
        friendship?._id?.toString?.() || "",
      recentMoments
    };
  }
}
