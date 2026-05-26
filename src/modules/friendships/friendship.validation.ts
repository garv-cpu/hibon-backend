import { z } from "zod";

export const sendFriendRequestSchema =
    z.object({
        username: z.string().min(1)
    });

export const respondFriendRequestSchema =
    z.object({
        friendshipId: z.string(),

        action: z.enum([
            "accepted",
            "rejected"
        ])
    });