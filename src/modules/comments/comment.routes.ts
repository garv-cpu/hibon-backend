import { Router } from "express";

import { protect } from "../auth/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  createComment,
  getMomentComments
} from "./comment.controller.js";
import {
  createCommentSchema
} from "./comment.validation.js";

const router = Router();

router.post(
  "/",
  protect,
  validate(createCommentSchema),
  createComment
);

router.get(
  "/moment/:momentId",
  protect,
  getMomentComments
);

export default router;
