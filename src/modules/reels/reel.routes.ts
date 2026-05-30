import { Router } from "express";

import { protect } from "../auth/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  generateReel,
  getMyReels,
  getReelById,
  regenerateReel
} from "./reel.controller.js";
import { generateReelSchema } from "./reel.validation.js";

const router = Router();

router.get(
  "/me",
  protect,
  getMyReels
);

router.post(
  "/generate",
  protect,
  validate(generateReelSchema),
  generateReel
);

router.get(
  "/:reelId",
  protect,
  getReelById
);

router.post(
  "/:reelId/regenerate",
  protect,
  regenerateReel
);

router.patch(
  "/:reelId/regenerate",
  protect,
  regenerateReel
);

export default router;
