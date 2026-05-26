import { Router } from "express";

import { protect } from "../auth/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  blockUser,
  deleteMe,
  getBlockedUsers,
  getMe,
  getNotificationPreferences,
  getPreferences,
  getPrivacy,
  joinPlusWaitlist,
  unblockUser,
  updateMe,
  updateNotificationPreferences,
  updatePreferences,
  updatePrivacy
} from "./user.controller.js";
import {
  notificationPreferencesSchema,
  preferencesSchema,
  privacySchema,
  updateMeSchema
} from "./user.validation.js";

const router = Router();

router.get(
  "/me",
  protect,
  getMe
);

router.patch(
  "/me",
  protect,
  validate(updateMeSchema),
  updateMe
);

router.get(
  "/me/notification-preferences",
  protect,
  getNotificationPreferences
);

router.patch(
  "/me/notification-preferences",
  protect,
  validate(notificationPreferencesSchema),
  updateNotificationPreferences
);

router.get(
  "/me/preferences",
  protect,
  getPreferences
);

router.patch(
  "/me/preferences",
  protect,
  validate(preferencesSchema),
  updatePreferences
);

router.get(
  "/me/privacy",
  protect,
  getPrivacy
);

router.patch(
  "/me/privacy",
  protect,
  validate(privacySchema),
  updatePrivacy
);

router.get(
  "/blocked",
  protect,
  getBlockedUsers
);

router.post(
  "/block/:userId",
  protect,
  blockUser
);

router.delete(
  "/block/:userId",
  protect,
  unblockUser
);

router.post(
  "/plus-waitlist",
  protect,
  joinPlusWaitlist
);

router.delete(
  "/me",
  protect,
  deleteMe
);

export default router;
