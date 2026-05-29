import {
  Request,
  Response,
  NextFunction
} from "express";

import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";

import { ApiError } from "../../utils/ApiError.js";

import { logAuthEvent } from "./auth.log.js";

interface JwtPayload {
  userId: string;
}

export interface AuthRequest
  extends Request {
  userId?: string;
}

export const protect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const fail = (reason: string): never => {
    logAuthEvent({
      event: "jwt_verification_failed",
      req,
      reason
    });

    throw new ApiError(
      401,
      reason
    );
  };

  try {
    const authHeader =
      req.headers.authorization ||
      fail("No authorization header");

    if (
      !authHeader.startsWith(
        "Bearer "
      )
    ) {
      fail("Invalid authorization format");
    }

    const token =
      authHeader.split(" ")[1];

    if (!token) {
      fail("Token missing");
    }

    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(
        token,
        env.JWT_ACCESS_SECRET
      ) as JwtPayload;
    } catch (error) {
      logAuthEvent({
        event: "jwt_verification_failed",
        req,
        reason:
          error instanceof Error
            ? error.message
            : "JWT verification failed"
      });

      throw error;
    }

    req.userId =
      decoded.userId;

    next();
  } catch (error) {
    next(
      new ApiError(
        401,
        "Invalid or expired token"
      )
    );
  }
};
