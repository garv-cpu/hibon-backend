import { User } from "../../database/models/User.model.js";
import { Moment } from "../../database/models/Moment.model.js";
import { ApiError } from "../../utils/ApiError.js";
import {
  cleanupExpiredMoments,
  getMomentExpiryCutoff
} from "../moments/moment.expiry.js";

interface UpdateMeInput {
  name?: string;
  bio?: string;
  avatarEmoji?: string;
  avatar?: string;
}

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
    totalMoments
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
          })
        }
      },
      {
        runValidators: true
      }
    );

    return toProfileResponse(userId);
  }
}
