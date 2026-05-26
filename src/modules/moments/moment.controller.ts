import { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { MomentService } from "./moment.service.js";
import { Moment } from "../../database/models/Moment.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { Friendship } from "../../database/models/Friendship.model.js";
import { User } from "../../database/models/User.model.js";
import { getIO } from "../../sockets/socket.server.js";
import { onlineUsers } from "../../sockets/onlineUsers.js";
import {
  cleanupExpiredMoments,
  getMomentExpiryCutoff
} from "./moment.expiry.js";

export const createMoment =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const existingMoment = await Moment.findOne({
        user: req.userId,
        createdAt: { $gte: todayStart }
      });

      if (existingMoment) {
        throw new ApiError(
          400,
          "You already logged today's moment"
        );
      }

      const moment =
        await MomentService.createMoment(
          req.userId!,
          req.body
        );

      const user =
        await User.findById(req.userId)
          .select("username avatar avatarEmoji");

      const friendships =
        await Friendship.find({
          status: "accepted",
          $or: [
            {
              requester: req.userId
            },
            {
              recipient: req.userId
            }
          ]
        }).lean();

      friendships.forEach((friendship) => {
        const friendId =
          friendship.requester.toString() ===
          req.userId
            ? friendship.recipient.toString()
            : friendship.requester.toString();

        const socketId =
          onlineUsers.get(friendId);

        if (socketId) {
          getIO()
            .to(socketId)
            .emit(
              "moment_posted",
              {
                userId: req.userId,
                username:
                  user?.username,
                avatarEmoji:
                  user?.avatarEmoji ||
                  "🌸",
                avatar:
                  user?.avatar || "",
                momentPreview:
                  moment.text.slice(0, 90),
                emoji: moment.emoji
              }
            );
        }
      });

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
      req: Request,
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

export const getMyMoments =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      await cleanupExpiredMoments();

      const moments =
        await Moment.find({
          user: req.userId,
          createdAt: {
            $gte: getMomentExpiryCutoff()
          }
        })
          .sort({
            createdAt: -1
          })
          .lean();

      res.json(
        new ApiResponse(
          "Moments fetched",
          moments
        )
      );
    }
  );
