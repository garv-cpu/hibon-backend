import {
  Request,
  Response,
  NextFunction
} from "express";

import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";

import { ApiError } from "../../utils/ApiError.js";

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
  try {
    const authHeader =
      req.headers.authorization;

    if (!authHeader) {
      throw new ApiError(
        401,
        "No authorization header"
      );
    }

    if (
      !authHeader.startsWith(
        "Bearer "
      )
    ) {
      throw new ApiError(
        401,
        "Invalid authorization format"
      );
    }

    const token =
      authHeader.split(" ")[1];

    if (!token) {
      throw new ApiError(
        401,
        "Token missing"
      );
    }

    const decoded = jwt.verify(
      token,
      env.JWT_ACCESS_SECRET
    ) as JwtPayload;

    req.userId = decoded.userId;

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