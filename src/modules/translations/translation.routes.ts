import { Router } from "express";

import { protect } from "../auth/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { translateText } from "./translation.controller.js";
import { translateSchema } from "./translation.validation.js";

const router = Router();

router.post(
  "/",
  protect,
  validate(translateSchema),
  translateText
);

export default router;
