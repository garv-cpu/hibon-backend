import { Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";

import { ApiResponse } from "../../utils/ApiResponse.js";

import { AuthRequest } from "../auth/auth.middleware.js";

import { FriendshipService } from "./friendship.service.js";

export const sendFriendRequest =
    asyncHandler(
        async (
            req: AuthRequest,
            res: Response
        ) => {
            const friendship =
                await FriendshipService.sendRequest(
                    req.userId!,
                    req.body.recipientId
                );

            res.status(201).json(
                new ApiResponse(
                    "Friend request sent",
                    friendship
                )
            );
        }
    );

export const respondFriendRequest =
    asyncHandler(
        async (
            req: AuthRequest,
            res: Response
        ) => {
            const friendship =
                await FriendshipService.respondRequest(
                    req.userId!,
                    req.body.friendshipId,
                    req.body.action
                );

            res.json(
                new ApiResponse(
                    `Request ${req.body.action}`,
                    friendship
                )
            );
        }
    );

export const getFriends =
    asyncHandler(
        async (
            req: AuthRequest,
            res: Response
        ) => {
            const friends =
                await FriendshipService.getFriends(
                    req.userId!
                );

            res.json(
                new ApiResponse(
                    "Friends fetched",
                    friends
                )
            );
        }
    );