import { Request, Response } from "express";

import { AuthService } from "./auth.service.js";

import { asyncHandler } from "../../utils/asyncHandler.js";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../../database/models/User.model.js";
import { env } from "../../config/env.js";
import { generateAccessToken } from "./auth.utils.js";
import { logAuthEvent } from "./auth.log.js";

export const register = asyncHandler(
  async (req: Request, res: Response) => {
    const email =
      String(req.body?.email || "")
        .trim()
        .toLowerCase();
    const username =
      String(req.body?.username || "")
        .trim()
        .toLowerCase();

    logAuthEvent({
      event: "signup_attempt",
      req,
      email,
      username
    });

    let result: Awaited<
      ReturnType<typeof AuthService.register>
    >;

    try {
      result =
        await AuthService.register(req.body);
    } catch (error) {
      logAuthEvent({
        event: "signup_failed",
        req,
        email,
        username,
        reason:
          error instanceof Error
            ? error.message
            : "Signup failed"
      });

      throw error;
    }

    logAuthEvent({
      event: "signup_success",
      req,
      email,
      username,
      userId: result.user._id.toString()
    });

    res
      .cookie(
        "refreshToken",
        result.refreshToken,
        {
          httpOnly: true,
          secure:
            process.env.NODE_ENV ===
            "production",

          sameSite: "strict",

          maxAge:
            365 * 24 * 60 * 60 * 1000
        }
      )

      .status(201)

      .json(
        new ApiResponse(
          "User registered successfully",
          {
            user: result.user,
            accessToken:
              result.accessToken,
            refreshToken:
              result.refreshToken
          }
        )
      );
  }
);

export const checkUsername = asyncHandler(
  async (req: Request, res: Response) => {
    const username =
      String(req.query.username || "")
        .trim()
        .toLowerCase();

    if (
      username.length < 3 ||
      !/^[a-z0-9_]+$/.test(username)
    ) {
      res.status(200).json(
        new ApiResponse(
          "Username checked",
          {
            available: false
          }
        )
      );
      return;
    }

    const existing =
      await User.exists({
        username
      });

    res.status(200).json(
      new ApiResponse(
        "Username checked",
        {
          available: !existing
        }
      )
    );
  }
);

export const login = asyncHandler(
  async (req: Request, res: Response) => {
    const identifier =
      String(
        req.body?.identifier ||
          req.body?.email ||
          ""
      )
        .trim()
        .toLowerCase();
    const isEmail =
      identifier.includes("@");

    logAuthEvent({
      event: "login_attempt",
      req,
      email: isEmail
        ? identifier
        : undefined,
      username: !isEmail
        ? identifier
        : undefined
    });

    let result: Awaited<
      ReturnType<typeof AuthService.login>
    >;

    try {
      result =
        await AuthService.login(req.body);
    } catch (error) {
      logAuthEvent({
        event: "login_failed",
        req,
        email: isEmail
          ? identifier
          : undefined,
        username: !isEmail
          ? identifier
          : undefined,
        reason:
          error instanceof Error
            ? error.message
            : "Login failed"
      });

      throw error;
    }

    logAuthEvent({
      event: "login_success",
      req,
      email: result.user.email,
      username: result.user.username,
      userId: result.user._id.toString()
    });

    res
      .cookie(
        "refreshToken",
        result.refreshToken,
        {
          httpOnly: true,

          secure:
            process.env.NODE_ENV ===
            "production",

          sameSite: "strict",

          maxAge:
            365 * 24 * 60 * 60 * 1000
        }
      )

      .status(200)

      .json(
        new ApiResponse(
          "Login successful",
          {
            user: result.user,
            accessToken:
              result.accessToken,
            refreshToken:
              result.refreshToken
          }
        )
      );
  }
);

export const refresh = async (req: Request, res: Response) => {
  const token =
    req.body?.refreshToken ||
    req.cookies?.refreshToken;

  if (!token) {
    logAuthEvent({
      event: "jwt_verification_failed",
      req,
      reason: "No refresh token"
    });

    throw new ApiError(401, "No refresh token");
  }

  try {
    const decoded = jwt.verify(
      token,
      env.JWT_REFRESH_SECRET
    ) as { userId: string };

    const user =
      await User.findById(decoded.userId)
        .select("+refreshToken");

    if (!user || user.refreshToken !== token) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const newAccessToken = generateAccessToken(user._id.toString());
    const safeUser = {
      _id: user._id,
      username: user.username,
      email: user.email,
      name: user.name || user.username,
      avatar: user.avatar,
      avatarEmoji: user.avatarEmoji,
      bio: user.bio,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      hasCompletedOnboarding:
        user.hasCompletedOnboarding ?? true
    };

    return res.status(200).json(
      new ApiResponse("Token refreshed", {
        accessToken: newAccessToken,
        user: safeUser
      })
    );
  } catch (err) {
    logAuthEvent({
      event: "jwt_verification_failed",
      req,
      reason:
        err instanceof Error
          ? err.message
          : "Refresh failed"
    });

    throw new ApiError(401, "Refresh failed");
  }
};
