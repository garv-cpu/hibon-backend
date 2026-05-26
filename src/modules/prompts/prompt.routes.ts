import express from "express";

import {
  getTodayPrompt
} from "./prompt.controller.js";

const router = express.Router();

router.get(
  "/today",
  getTodayPrompt
);

export default router;