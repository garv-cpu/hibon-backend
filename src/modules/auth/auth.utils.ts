import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export const generateAccessToken = (
    userId: string
) => {
    return jwt.sign(
        { userId },
        env.JWT_ACCESS_SECRET,
        {
            expiresIn: "15m"
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
            expiresIn: "7d"
        }
    );
};

export const serializeUser = (
    user: any
) => ({
    _id: user._id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    currentStreak:
        user.currentStreak,

    longestStreak:
        user.longestStreak
});