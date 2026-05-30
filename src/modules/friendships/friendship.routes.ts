import { Router } from "express";

import { protect } from "../auth/auth.middleware.js";

import { validate } from "../../middleware/validate.middleware.js";

import {
    sendFriendRequestSchema,
    respondFriendRequestSchema
} from "./friendship.validation.js";

import {
    sendFriendRequest,
    respondFriendRequest,
    getFriends,
    getPendingRequests,
    removeFriend,
    nudgeFriend
} from "./friendship.controller.js";

const router = Router();

router.post(
    "/request",
    protect,
    validate(
        sendFriendRequestSchema
    ),
    sendFriendRequest
);

router.post(
    "/respond",
    protect,
    validate(
        respondFriendRequestSchema
    ),
    respondFriendRequest
);

router.get(
    "/requests",
    protect,
    getPendingRequests
);

router.get(
    "/list",
    protect,
    getFriends
);

router.delete(
    "/:userId",
    protect,
    removeFriend
);

router.post(
    "/nudge",
    protect,
    nudgeFriend
);

export default router;
