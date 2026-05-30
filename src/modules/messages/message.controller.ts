import { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { MessageService } from "./message.service.js";

export const getChats =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const chats =
        await MessageService.getChats(
          req.userId!
        );

      res.json(
        new ApiResponse(
          "Chats fetched",
          chats
        )
      );
    }
  );

export const getConversation =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const messages =
        await MessageService.getConversation(
          req.userId!,
          String(req.params.userId)
        );

      res.json(
        new ApiResponse(
          "Messages fetched",
          messages
        )
      );
    }
  );

export const sendMessage =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const message =
        await MessageService.sendMessage(
          req.userId!,
          String(req.body.recipientId || ""),
          String(req.body.text || "")
        );

      res.status(201).json(
        new ApiResponse(
          "Message sent",
          message
        )
      );
    }
  );
