import { Request } from "express";

import logger from "../../config/logger.js";

type AuthEvent =
  | "signup_attempt"
  | "signup_success"
  | "signup_failed"
  | "login_attempt"
  | "login_success"
  | "login_failed"
  | "jwt_verification_failed";

interface AuthLogInput {
  event: AuthEvent;
  req: Request;
  email?: string;
  username?: string;
  userId?: string;
  reason?: string;
}

const devColors: Record<
  AuthEvent,
  string
> = {
  signup_attempt: "\x1b[36m",
  signup_success: "\x1b[32m",
  signup_failed: "\x1b[31m",
  login_attempt: "\x1b[36m",
  login_success: "\x1b[32m",
  login_failed: "\x1b[31m",
  jwt_verification_failed: "\x1b[33m"
};

const resetColor = "\x1b[0m";

const getClientIp = (req: Request) => {
  const forwardedFor =
    req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string") {
    return forwardedFor
      .split(",")[0]
      .trim();
  }

  if (Array.isArray(forwardedFor)) {
    return forwardedFor[0];
  }

  return req.ip || req.socket.remoteAddress || "";
};

const getFailureReason = (
  reason?: string
) =>
  reason && reason.trim()
    ? reason.trim()
    : "Unknown authentication failure";

export const logAuthEvent = ({
  event,
  req,
  email,
  username,
  userId,
  reason
}: AuthLogInput) => {
  const payload = {
    event,
    email,
    username,
    userId,
    ip: getClientIp(req),
    userAgent:
      req.get("user-agent") || "",
    timestamp:
      new Date().toISOString(),
    success:
      event.endsWith("_success"),
    reason:
      event.endsWith("_failed") ||
      event === "jwt_verification_failed"
        ? getFailureReason(reason)
        : undefined
  };

  const message =
    `auth.${event}`;

  if (
    event.endsWith("_failed") ||
    event === "jwt_verification_failed"
  ) {
    logger.warn(payload, message);
  } else {
    logger.info(payload, message);
  }

  if (process.env.NODE_ENV !== "production") {
    const color =
      devColors[event] || "";
    const identity =
      username ||
      email ||
      userId ||
      "unknown";
    const reasonText =
      payload.reason
        ? ` reason=${payload.reason}`
        : "";

    console.log(
      `${color}[auth] ${event} identity=${identity} ip=${payload.ip}${reasonText}${resetColor}`
    );
  }
};
