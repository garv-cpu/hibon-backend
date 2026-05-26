import { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { CommentService } from "./comment.service.js";

export const createComment =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const comment =
        await CommentService.createComment(
          req.userId!,
          req.body.momentId,
          req.body.text
        );

      res.status(201).json(
        new ApiResponse(
          "Comment added",
          comment
        )
      );
    }
  );

export const getMomentComments =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const comments =
        await CommentService.getMomentComments(
          String(req.params.momentId)
        );

      res.json(
        new ApiResponse(
          "Comments fetched",
          comments
        )
      );
    }
  );
