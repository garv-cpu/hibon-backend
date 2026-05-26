import { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

import { ReactionService } from "./reaction.service.js";

export const reactToMoment =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {

      const { momentId, emoji } = req.body;

      const reaction =
        await ReactionService.reactToMoment(
          req.userId!,
          momentId,
          emoji
        );

      res.json(
        new ApiResponse(
          "Reaction added",
          reaction
        )
      );
    }
  ); 
