import { z } from "zod";

export const sendFriendRequestSchema =
    z.object({
        recipientId: z.string()
    });

export const respondFriendRequestSchema =
    z.object({
        friendshipId: z.string(),

        action: z.enum([
            "accepted",
            "rejected"
        ])
    });