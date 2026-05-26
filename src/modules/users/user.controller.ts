import { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

import { UserService } from "./user.service.js";

export const getMe =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const profile =
        await UserService.getMe(
          req.userId!
        );

      res.json(
        new ApiResponse(
          "Profile fetched",
          profile
        )
      );
    }
  );

export const updateMe =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const profile =
        await UserService.updateMe(
          req.userId!,
          req.body
        );

      res.json(
        new ApiResponse(
          "Profile updated",
          profile
        )
      );
    }
  );

export const getNotificationPreferences =
  asyncHandler(async (req, res) => {
    const preferences =
      await UserService.getNotificationPreferences(
        req.userId!
      );

    res.json(
      new ApiResponse(
        "Notification preferences fetched",
        preferences
      )
    );
  });

export const updateNotificationPreferences =
  asyncHandler(async (req, res) => {
    const preferences =
      await UserService.updateNotificationPreferences(
        req.userId!,
        req.body
      );

    res.json(
      new ApiResponse(
        "Notification preferences updated",
        preferences
      )
    );
  });

export const getPreferences =
  asyncHandler(async (req, res) => {
    const preferences =
      await UserService.getPreferences(
        req.userId!
      );

    res.json(
      new ApiResponse(
        "Preferences fetched",
        preferences
      )
    );
  });

export const updatePreferences =
  asyncHandler(async (req, res) => {
    const preferences =
      await UserService.updatePreferences(
        req.userId!,
        req.body
      );

    res.json(
      new ApiResponse(
        "Preferences updated",
        preferences
      )
    );
  });

export const getPrivacy =
  asyncHandler(async (req, res) => {
    const privacy =
      await UserService.getPrivacy(
        req.userId!
      );

    res.json(
      new ApiResponse(
        "Privacy fetched",
        privacy
      )
    );
  });

export const updatePrivacy =
  asyncHandler(async (req, res) => {
    const privacy =
      await UserService.updatePrivacy(
        req.userId!,
        req.body
      );

    res.json(
      new ApiResponse(
        "Privacy updated",
        privacy
      )
    );
  });

export const getBlockedUsers =
  asyncHandler(async (req, res) => {
    const blockedUsers =
      await UserService.getBlockedUsers(
        req.userId!
      );

    res.json(
      new ApiResponse(
        "Blocked users fetched",
        blockedUsers
      )
    );
  });

export const blockUser =
  asyncHandler(async (req, res) => {
    const blockedUsers =
      await UserService.blockUser(
        req.userId!,
        String(req.params.userId)
      );

    res.status(201).json(
      new ApiResponse(
        "User blocked",
        blockedUsers
      )
    );
  });

export const unblockUser =
  asyncHandler(async (req, res) => {
    const blockedUsers =
      await UserService.unblockUser(
        req.userId!,
        String(req.params.userId)
      );

    res.json(
      new ApiResponse(
        "User unblocked",
        blockedUsers
      )
    );
  });

export const joinPlusWaitlist =
  asyncHandler(async (req, res) => {
    const result =
      await UserService.joinPlusWaitlist(
        req.userId!
      );

    res.status(201).json(
      new ApiResponse(
        "Joined waitlist",
        result
      )
    );
  });

export const deleteMe =
  asyncHandler(async (req, res) => {
    const result =
      await UserService.deleteMe(
        req.userId!
      );

    res.json(result);
  });
