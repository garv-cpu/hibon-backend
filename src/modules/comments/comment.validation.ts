import { z } from "zod";

export const createCommentSchema =
  z.object({
    momentId: z.string().min(1),

    text: z
      .string()
      .trim()
      .min(1)
      .max(240)
  });
