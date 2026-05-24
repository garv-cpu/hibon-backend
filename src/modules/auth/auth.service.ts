import bcrypt from "bcryptjs";

import { User } from "../../database/models/User.model.js";

import { ApiError } from "../../utils/ApiError.js";

import {
    generateAccessToken,
    generateRefreshToken
} from "./auth.utils.js";

interface RegisterInput {
    username: string;
    email: string;
    password: string;
}

interface LoginInput {
    email: string;
    password: string;
}

export class AuthService {
    static async register(data: RegisterInput) {
        const existingUser = await User.findOne({
            $or: [
                { email: data.email },
                { username: data.username }
            ]
        });

        if (existingUser) {
            throw new ApiError(
                409,
                "User already exists"
            );
        }

        const hashedPassword =
            await bcrypt.hash(data.password, 12);

        const user = await User.create({
            ...data,
            password: hashedPassword
        });

        const accessToken =
            generateAccessToken(user._id.toString());

        const refreshToken =
            generateRefreshToken(user._id.toString());

        user.refreshToken = refreshToken;

        await user.save();

        const safeUser = {
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            currentStreak: user.currentStreak,
            longestStreak: user.longestStreak
        };

        return {
            user: safeUser,
            accessToken,
            refreshToken
        };
    }

    static async login(data: LoginInput) {
        const user = await User.findOne({
            email: data.email
        }).select("+password +refreshToken");

        if (!user) {
            throw new ApiError(
                401,
                "Invalid credentials"
            );
        }

        const isPasswordCorrect =
            await bcrypt.compare(
                data.password,
                user.password
            );

        if (!isPasswordCorrect) {
            throw new ApiError(
                401,
                "Invalid credentials"
            );
        }

        const accessToken =
            generateAccessToken(user._id.toString());

        const refreshToken =
            generateRefreshToken(user._id.toString());

        user.refreshToken = refreshToken;

        await user.save();

        const safeUser = {
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            currentStreak: user.currentStreak,
            longestStreak: user.longestStreak
        };

        return {
            user: safeUser,
            accessToken,
            refreshToken
        };
    }
}