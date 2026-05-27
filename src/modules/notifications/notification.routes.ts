// modules/notifications/notification.routes.js

import express from "express";

import { protect } from "../auth/auth.middleware.js";

import {
    clearNotifications,
    getNotifications,
    getUnreadCount,
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

router.get(
    "/unread-count",
    protect,
    getUnreadCount
);

router.patch(
    "/read-all",
    protect,
    markAllAsRead
);

router.delete(
    "/",
    protect,
    clearNotifications
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
