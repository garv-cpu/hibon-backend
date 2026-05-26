import { Router } from "express";

import { protect } from "../auth/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { generateReel, getMyReels } from "./reel.controller.js";
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

export default router;
