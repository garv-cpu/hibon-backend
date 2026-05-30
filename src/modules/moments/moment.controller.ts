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
import { NotificationService } from "../notifications/notification.service.js";
import { sendPushToUser } from "../../lib/pushNotifications.js";
import {
  getMomentExpiryCutoff
} from "./moment.expiry.js";
import {
  getOnThisDayForUser
} from "./onThisDay.service.js";

export const createMoment =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {

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

      const friendIds =
        friendships.map((friendship) =>
          friendship.requester.toString() ===
          req.userId
            ? friendship.recipient.toString()
            : friendship.requester.toString()
        );

      const friends =
        await User.find({
          _id: {
            $in: friendIds
          },
          "notificationPreferences.momentPosted": {
            $ne: false
          }
        })
          .select("_id")
          .lean();

      await Promise.all(
        friends.map(async (friend) => {
        const friendId =
          friend._id.toString();

        await NotificationService.createNotification({
          recipient: friendId,
          sender: req.userId!,
          type: "moment",
          title: "New circle moment",
          message: `@${user?.username} shared a new bon moment`,
          entityId: moment._id.toString()
        });

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

        await sendPushToUser(
          friendId,
          {
            title: "New circle moment",
            body: `@${user?.username} shared: ${moment.text.slice(0, 80)}`,
            data: {
              type: "moment",
              momentId: moment._id.toString()
            }
          }
        );
      })
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

export const getMomentById =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const moment =
        await MomentService.getMomentById(
          req.userId!,
          String(req.params.id)
        );

      res.json(
        new ApiResponse(
          "Moment fetched",
          moment
        )
      );
    }
  );

export const getOnThisDay =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const data =
        await getOnThisDayForUser(
          req.userId!
        );

      res.json(
        new ApiResponse(
          "On this day fetched",
          data
        )
      );
    }
  );
