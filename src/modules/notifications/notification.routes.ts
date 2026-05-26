// modules/notifications/notification.routes.js

import express from "express";

import { protect } from "../auth/auth.middleware.js";

import {
    getNotifications,
    markAllAsRead,
    markAsRead,
    savePushToken
} from "./notification.controller.js";

const router = express.Router();

router.get(
    "/",
    protect,
    getNotifications
);

router.patch(
    "/read-all",
    protect,
    markAllAsRead
);

router.patch(
    "/:id/read",
    protect,
    markAsRead
);

router.post(
    "/push-token",
    protect,
    savePushToken
);

export default router;
