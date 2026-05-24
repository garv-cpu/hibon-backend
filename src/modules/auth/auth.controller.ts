import { Request, Response } from "express";

import { AuthService } from "./auth.service.js";

import { asyncHandler } from "../../utils/asyncHandler.js";

import { ApiResponse } from "../../utils/ApiResponse.js";

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