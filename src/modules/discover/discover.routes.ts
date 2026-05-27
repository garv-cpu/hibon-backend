import { Router } from "express";

import { protect } from "../auth/auth.middleware.js";
import {
  nearbyUsers,
  searchUsers,
  updateDiscoverLocation
} from "./discover.controller.js";

const router = Router();

router.patch(
  "/location",
  protect,
  updateDiscoverLocation
);

router.get(
  "/nearby",
  protect,
  nearbyUsers
);

router.get(
  "/search",
  protect,
  searchUsers
);

export default router;
