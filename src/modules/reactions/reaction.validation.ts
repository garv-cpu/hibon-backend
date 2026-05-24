import { z } from "zod";

export const reactionSchema =
    z.object({
        momentId: z.string(),

        emoji: z
            .string()
            .min(1)
            .max(10)
    });