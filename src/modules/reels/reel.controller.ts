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

export const getReelById =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const reel =
        await ReelService.getById(
          req.userId!,
          String(req.params.reelId)
        );

      res.json(
        new ApiResponse(
          "Reel fetched",
          reel
        )
      );
    }
  );

export const regenerateReel =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const reel =
        await ReelService.regenerate(
          req.userId!,
          String(req.params.reelId)
        );

      res.json(
        new ApiResponse(
          "Reel regenerated",
          reel
        )
      );
    }
  );
