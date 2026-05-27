import { Router } from "express";

import {
  register,
  login,
  refresh,
  checkUsername
} from "./auth.controller.js";

import {
  registerSchema,
  loginSchema
} from "./auth.validation.js";

import { validate } from "../../middleware/validate.middleware.js";

const router = Router();

router.post(
  "/register",
  validate(registerSchema),
  register
);

router.post(
  "/login",
  validate(loginSchema),
  login
);

router.get(
  "/check-username",
  checkUsername
);

router.post("/refresh", refresh);

export default router;
