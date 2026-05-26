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
