import { Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";

import { ApiResponse } from "../../utils/ApiResponse.js";

import { AuthRequest } from "../auth/auth.middleware.js";

import { ReactionService } from "./reaction.service.js";

export const reactToMoment =
  asyncHandler(
    async (
      req: AuthRequest,
      res: Response
    ) => {
      const reaction =
        await ReactionService.reactToMoment(
          req.userId!,
          req.body.momentId,
          req.body.emoji
        );

      res.json(
        new ApiResponse(
          "Reaction added",
          reaction
        )
      );
    }
  );