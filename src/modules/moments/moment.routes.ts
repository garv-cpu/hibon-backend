import { Router } from "express";

import {
    createMoment,
    getFeed,
    getMomentById,
    getMyMoments
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
    "/me",
    protect,
    getMyMoments
);

router.get(
    "/feed",
    protect,
    getFeed
);

router.get(
    "/:id",
    protect,
    getMomentById
);

export default router;
