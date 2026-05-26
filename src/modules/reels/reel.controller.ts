import { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ReelService } from "./reel.service.js";

export const getMyReels =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const reels =
        await ReelService.getMyReels(
          req.userId!
        );

      res.json(
        new ApiResponse(
          "Reels fetched",
          reels
        )
      );
    }
  );

export const generateReel =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const reel =
        await ReelService.generate(
          req.userId!,
          req.body
        );

      res.status(201).json(
        new ApiResponse(
          "Reel generated",
          reel
        )
      );
    }
  );
