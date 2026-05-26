import express from "express";

import { protect } from "../auth/auth.middleware.js";

import {
    syncContacts
} from "./contacts.controller.js";

const router =
    express.Router();

router.post(
    "/sync",
    protect,
    syncContacts
);

export default router;