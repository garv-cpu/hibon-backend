import { Router } from "express";

import { protect } from "../auth/auth.middleware.js";
import {
  getChats,
  getConversation,
  sendMessage
} from "./message.controller.js";

const router = Router();

router.get(
  "/chats",
  protect,
  getChats
);

router.get(
  "/:userId",
  protect,
  getConversation
);

router.post(
  "/",
  protect,
  sendMessage
);

export default router;
