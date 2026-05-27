import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export const generateAccessToken = (
    userId: string
) => {
    return jwt.sign(
        { userId },
        env.JWT_ACCESS_SECRET,
        {
            expiresIn: "1h"
        }
    );
};

export const generateRefreshToken = (
    userId: string
) => {
    return jwt.sign(
        { userId },
        env.JWT_REFRESH_SECRET,
        {
            expiresIn: "365d"
        }
    );
};

export const serializeUser = (
    user: any
) => ({
    _id: user._id,
    username: user.username,
    email: user.email,
    name: user.name || user.username,
    avatar: user.avatar,
    avatarEmoji:
        user.avatarEmoji || "🌸",
    bio: user.bio || "",
    currentStreak:
        user.currentStreak,

    longestStreak:
        user.longestStreak,
    hasCompletedOnboarding:
        user.hasCompletedOnboarding ?? true
});
