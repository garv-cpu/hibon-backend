import { Request, Response } from "express";

import { AuthService } from "./auth.service.js";

import { asyncHandler } from "../../utils/asyncHandler.js";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../../database/models/User.model.js";
import { env } from "../../config/env.js";
import { generateAccessToken } from "./auth.utils.js";

export const register = asyncHandler(
  async (req: Request, res: Response) => {
    const result =
      await AuthService.register(req.body);

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
            7 * 24 * 60 * 60 * 1000
        }
      )

      .status(201)

      .json(
        new ApiResponse(
          "User registered successfully",
          {
            user: result.user,
            accessToken:
              result.accessToken
          }
        )
      );
  }
);

export const login = asyncHandler(
  async (req: Request, res: Response) => {
    const result =
      await AuthService.login(req.body);

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
            7 * 24 * 60 * 60 * 1000
        }
      )

      .status(200)

      .json(
        new ApiResponse(
          "Login successful",
          {
            user: result.user,
            accessToken:
              result.accessToken
          }
        )
      );
  }
);

export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    throw new ApiError(401, "No refresh token");
  }

  try {
    const decoded = jwt.verify(
      token,
      env.JWT_REFRESH_SECRET
    ) as { userId: string };

    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== token) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const newAccessToken = generateAccessToken(user._id.toString());

    return res.status(200).json(
      new ApiResponse("Token refreshed", {
        accessToken: newAccessToken
      })
    );
  } catch (err) {
    throw new ApiError(401, "Refresh failed");
  }
};