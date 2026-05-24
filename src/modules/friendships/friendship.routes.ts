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
    getFriends
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
    "/list",
    protect,
    getFriends
);

export default router;