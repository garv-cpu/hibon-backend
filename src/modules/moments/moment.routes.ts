import { Router } from "express";

import {
    createMoment,
    getFeed
} from "./moment.controller.js";

import { protect } from "../auth/auth.middleware.js";

import { validate } from "../../middleware/validate.middleware.js";

import { createMomentSchema } from "./moment.validation.js";

const router = Router();

router.post(
    "/",
    protect,
    validate(createMomentSchema),
    createMoment
);

router.get(
    "/feed",
    protect,
    getFeed
);

export default router;