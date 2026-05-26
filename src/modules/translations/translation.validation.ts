import { z } from "zod";

export const translateSchema =
  z.object({
    text: z
      .string()
      .trim()
      .min(1)
      .max(1000),
    targetLanguage: z.enum([
      "en",
      "hi",
      "es"
    ])
  });
