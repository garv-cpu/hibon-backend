import { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

import { FriendshipService } from "./friendship.service.js";

import { User } from "../../database/models/User.model.js";
import Notification from "../../database/models/Notification.model.js";
import { NotificationService } from "../notifications/notification.service.js";
import { getIO } from "../../sockets/socket.server.js";
import { onlineUsers } from "../../sockets/onlineUsers.js";
import { sendPushToUser } from "../../lib/pushNotifications.js";

export const sendFriendRequest =
    asyncHandler(async (req: Request, res: Response) => {

        const username = req.body.username?.trim().toLowerCase();

        if (!username) {
            res.status(400).json({
                success: false,
                message: "Username is required"
            });
            return;
        }

        // Find user by username
        const recipient = await User.findOne({
            username: username,
            "privacy.showInSearch": {
                $ne: false
            }
        });

        // User not found
        if (!recipient) {
            res.status(404).json({
                success: false,
                message: "This user is not on Hibon"
            });
            return;
        }

        // Prevent self request
        if (recipient._id.toString() === req.userId) {
            res.status(400).json({
                success: false,
                message: "You cannot add yourself"
            });
            return;
        }

        if (
            recipient.privacy?.allowFriendRequests === false
        ) {
            res.status(403).json({
                success: false,
                message: "This user is not accepting friend requests"
            });
            return;
        }

        const friendship =
            await FriendshipService.sendRequest(
                req.userId!,
                recipient._id.toString()
            );

        const currentUser =
            await User.findById(req.userId)
                .select("username avatar avatarEmoji");

        const wantsFriendRequestAlerts =
            recipient.notificationPreferences?.friendRequests !== false;

        if (wantsFriendRequestAlerts) {
            await NotificationService.createNotification({
                recipient: recipient._id.toString(),
                sender: req.userId!,
                type: "friend_request",
                title: "New friend request",
                message: `${currentUser?.username} sent you a friend request`,
                entityId: friendship._id.toString()
            });

            const recipientSocket =
                onlineUsers.get(
                    recipient._id.toString()
                );

            if (recipientSocket) {
                getIO()
                    .to(recipientSocket)
                    .emit(
                        "friend_request_received",
                        {
                            requesterId: req.userId,
                            requesterUsername:
                                currentUser?.username,
                            requesterAvatarEmoji:
                                currentUser?.avatarEmoji ||
                                "🌸",
                            requesterAvatar:
                                currentUser?.avatar ||
                                "",
                            requestId:
                                friendship._id.toString()
                        }
                    );
            }

            await sendPushToUser(
                recipient._id.toString(),
                {
                    title:
                        "New friend request 👋",
                    body: `@${currentUser?.username} wants to join your circle`,
                    data: {
                        type: "friend_request",
                        requestId:
                            friendship._id.toString()
                    }
                }
            );
        }

        res.status(201).json({
            success: true,
            message: "Friend request sent!",
            data: friendship
        });
    });

export const respondFriendRequest =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {

            const friendship =
                await FriendshipService.respondRequest(
                    req.userId!,
                    req.body.friendshipId,
                    req.body.action
                );

            if (req.body.action === "accepted") {
                const acceptor =
                    await User.findById(
                        req.userId
                    ).select(
                        "username avatar avatarEmoji"
                    );

                const requesterId =
                    friendship.requester.toString();
                const requester =
                    await User.findById(requesterId)
                        .select("notificationPreferences")
                        .lean();
                const wantsAcceptedAlerts =
                    requester?.notificationPreferences?.friendRequests !== false;

                const requesterSocket =
                    onlineUsers.get(
                        requesterId
                    );

                if (requesterSocket && wantsAcceptedAlerts) {
                    getIO()
                        .to(requesterSocket)
                        .emit(
                            "friend_request_accepted",
                            {
                                acceptorUsername:
                                    acceptor?.username,
                                acceptorAvatarEmoji:
                                    acceptor?.avatarEmoji ||
                                    "🌸",
                                acceptorAvatar:
                                    acceptor?.avatar ||
                                    ""
                            }
                        );
                }

                if (wantsAcceptedAlerts) {
                    await sendPushToUser(
                        requesterId,
                        {
                            title:
                                "Request accepted 🎉",
                            body: `@${acceptor?.username} added you to their circle`,
                            data: {
                                type: "friend_accept"
                            }
                        }
                    );
                }
            }

            // REMOVE NOTIFICATION
            await Notification.findOneAndDelete({
                entityId: req.body.friendshipId,
                type: "friend_request"
            });

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
            req: Request,
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

export const getPendingRequests =
    asyncHandler(
        async (
            req: Request,
            res: Response
        ) => {

            const requests =
                await FriendshipService.getPendingRequests(
                    req.userId!
                );

            res.json(
                new ApiResponse(
                    "Pending requests fetched",
                    requests
                )
            );
        }
    );
