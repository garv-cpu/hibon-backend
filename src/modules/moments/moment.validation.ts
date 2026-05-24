import { z } from "zod";

export const createMomentSchema =
    z.object({
        text: z
            .string()
            .min(1)
            .max(300),

        emoji: z
            .string()
            .min(1)
            .max(10)
    });