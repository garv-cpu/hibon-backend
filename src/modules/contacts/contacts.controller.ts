import { Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";

import { ApiResponse } from "../../utils/ApiResponse.js";

import { AuthRequest } from "../auth/auth.middleware.js";

import { ContactsService } from "./contacts.service.js";

export const syncContacts =
  asyncHandler(
    async (
      req: AuthRequest,
      res: Response
    ) => {

      const data =
        await ContactsService.syncContacts(
          req.body.contacts,
          req.userId!
        );

      res.status(200).json(
        new ApiResponse(
          "Contacts synced",
          data
        )
      );
    }
  );