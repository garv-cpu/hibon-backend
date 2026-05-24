import { Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";

import { ApiResponse } from "../../utils/ApiResponse.js";

import { MomentService } from "./moment.service.js";

import { AuthRequest } from "../auth/auth.middleware.js";

export const createMoment =
    asyncHandler(
        async (
            req: AuthRequest,
            res: Response
        ) => {
            const moment =
                await MomentService.createMoment(
                    req.userId!,
                    req.body
                );

            res.status(201).json(
                new ApiResponse(
                    "Moment created",
                    moment
                )
            );
        }
    );

export const getFeed =
    asyncHandler(
        async (
            req: AuthRequest,
            res: Response
        ) => {
            const feed =
                await MomentService.getFeed(
                    req.userId!
                );

            res.json(
                new ApiResponse(
                    "Feed fetched",
                    feed
                )
            );
        }
    );