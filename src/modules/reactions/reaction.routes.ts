import { Router } from "express";

import { protect } from "../auth/auth.middleware.js";

import { validate } from "../../middleware/validate.middleware.js";

import { reactionSchema } from "./reaction.validation.js";

import { reactToMoment } from "./reaction.controller.js";

const router = Router();

router.post(
  "/",
  protect,
  validate(reactionSchema),
  reactToMoment
);

export default router;