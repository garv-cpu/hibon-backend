import { z } from "zod";

export const updateMeSchema =
  z.object({
    name: z
      .string()
      .trim()
      .max(50)
      .optional(),

    bio: z
      .string()
      .trim()
      .max(160)
      .optional(),

    avatarEmoji: z
      .string()
      .trim()
      .min(1)
      .max(8)
      .optional(),

    avatar: z
      .string()
      .max(4_000_000)
      .optional()
  });

export const notificationPreferencesSchema =
  z.object({
    friendRequests: z
      .boolean()
      .optional(),
    reactions: z
      .boolean()
      .optional(),
    streakReminders: z
      .boolean()
      .optional(),
    reminderTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):(00|15|30|45)$/)
      .optional(),
    weeklyDigest: z
      .boolean()
      .optional(),
    momentPosted: z
      .boolean()
      .optional()
  });

export const preferencesSchema =
  z.object({
    theme: z
      .enum([
        "system",
        "dark",
        "light"
      ])
      .optional(),
    accentColor: z
      .enum([
        "#F5A623",
        "#FF6B6B",
        "#A78BFA",
        "#6EE7B7",
        "#FDA4AF",
        "#7DD3FC"
      ])
      .optional(),
    fontScale: z
      .number()
      .min(0.9)
      .max(1.12)
      .optional()
  });

export const privacySchema =
  z.object({
    profileVisibility: z
      .enum([
        "friends",
        "private"
      ])
      .optional(),
    showStreakOnProfile: z
      .boolean()
      .optional(),
    showInSearch: z
      .boolean()
      .optional(),
    allowFriendRequests: z
      .boolean()
      .optional()
  });
