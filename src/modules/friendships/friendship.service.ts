import { Friendship } from "../../database/models/Friendship.model.js";

import { Moment } from "../../database/models/Moment.model.js";

import { User } from "../../database/models/User.model.js";

import { ApiError } from "../../utils/ApiError.js";

import { onlineUsers } from "../../sockets/onlineUsers.js";

import { isSameDay } from "../moments/helpers/date.helper.js";

export class FriendshipService {
  static async areFriends(
    userId: string,
    friendId: string
  ) {
    const friendship =
      await Friendship.findOne({
        status: "accepted",
        $or: [
          {
            requester: userId,
            recipient: friendId
          },
          {
            requester: friendId,
            recipient: userId
          }
        ]
      })
        .select("_id")
        .lean();

    return Boolean(friendship);
  }

  static async sendRequest(
    requesterId: string,
    recipientId: string
  ) {
    if (
      requesterId === recipientId
    ) {
      throw new ApiError(
        400,
        "Cannot friend yourself"
      );
    }

    const recipient =
      await User.findById(
        recipientId
      );

    if (!recipient) {
      throw new ApiError(
        404,
        "Recipient not found"
      );
    }

    const requester =
      await User.findById(requesterId)
        .select("blockedUsers")
        .lean();

    const requesterBlocked =
      (requester?.blockedUsers || [])
        .some(
          (id: any) =>
            id.toString() === recipientId
        );

    const recipientBlocked =
      (recipient.blockedUsers || [])
        .some(
          (id: any) =>
            id.toString() === requesterId
        );

    if (requesterBlocked || recipientBlocked) {
      throw new ApiError(
        403,
        "Friend requests are not available for this user"
      );
    }

    const existing = await Friendship.findOne({
      $or: [
        {
          requester: requesterId,
          recipient: recipientId
        },
        {
          requester: recipientId,
          recipient: requesterId
        }
      ]
    });

    if (existing) {
      if (existing.status === "pending") {
        throw new ApiError(
          400,
          "Friend request already pending"
        );
      }

      if (existing.status === "accepted") {
        throw new ApiError(
          400,
          "You are already friends"
        );
      }
    }

    return await Friendship.create({
      requester: requesterId,
      recipient: recipientId
    });
  }

  static async respondRequest(
    userId: string,
    friendshipId: string,
    action:
      | "accepted"
      | "rejected"
  ) {
    const friendship =
      await Friendship.findById(
        friendshipId
      );

    if (!friendship) {
      throw new ApiError(
        404,
        "Request not found"
      );
    }

    if (
      friendship.recipient.toString() !==
      userId
    ) {
      throw new ApiError(
        403,
        "Unauthorized"
      );
    }

    friendship.status = action;

    await friendship.save();

    if (action === "accepted") {
      await User.findByIdAndUpdate(
        friendship.requester,
        {
          $inc: {
            friendsCount: 1
          }
        }
      );

      await User.findByIdAndUpdate(
        friendship.recipient,
        {
          $inc: {
            friendsCount: 1
          }
        }
      );
    }

    return friendship;
  }

  static async getFriends(
    userId: string
  ) {
    const currentUser =
      await User.findById(userId)
        .select("blockedUsers")
        .lean();

    const blockedByMe =
      new Set(
        (currentUser?.blockedUsers || [])
          .map((id: any) => id.toString())
      );

    const blockedMeUsers =
      await User.find({
        blockedUsers: userId
      })
        .select("_id")
        .lean();

    const blockedMe =
      new Set(
        blockedMeUsers.map((user) =>
          user._id.toString()
        )
      );

    const friendships =
      await Friendship.find({
      status: "accepted",

      $or: [
        { requester: userId },
        { recipient: userId }
      ]
    })
      .populate(
        "requester",
        "username avatar avatarEmoji currentStreak lastMomentDate lastSeenAt timezone"
      )
      .populate(
        "recipient",
        "username avatar avatarEmoji currentStreak lastMomentDate lastSeenAt timezone"
      )
      .lean();

    const friends =
      friendships.map(
        (friendship: any) => {
          const requesterId =
            friendship.requester?._id?.toString();

          return requesterId === userId
            ? friendship.recipient
            : friendship.requester;
        }
      );

    const friendIds =
      friends
        .map((friend: any) =>
          friend?._id?.toString()
        )
        .filter(Boolean);

    const latestMoments =
      await Moment.find({
        user: {
          $in: friendIds
        }
      })
        .sort({
          createdAt: -1
        })
        .lean();

    const latestMomentByUser =
      new Map<string, any>();

    latestMoments.forEach(
      (moment: any) => {
        const momentUserId =
          moment.user?.toString();

        if (
          momentUserId &&
          !latestMomentByUser.has(
            momentUserId
          )
        ) {
          latestMomentByUser.set(
            momentUserId,
            {
              _id: moment._id.toString(),
              text: moment.text,
              emoji: moment.emoji,
              createdAt: moment.createdAt
            }
          );
        }
      }
    );

    return friends.map(
      (friend: any) => {
        const friendId =
          friend._id.toString();

        return {
          _id: friendId,
          username: friend.username,
          avatar: friend.avatar,
          avatarEmoji:
            friend.avatarEmoji || "🌸",
          currentStreak:
            friend.currentStreak ?? 0,
          hasPostedToday:
            !!friend.lastMomentDate &&
            isSameDay(
              friend.lastMomentDate,
              new Date(),
              friend.timezone || "UTC"
            ),
          isOnline:
            onlineUsers.has(friendId),
          lastSeenAt: friend.lastSeenAt,
          isBlockedByMe:
            blockedByMe.has(friendId),
          hasBlockedMe:
            blockedMe.has(friendId),
          lastMoment:
            blockedByMe.has(friendId) ||
            blockedMe.has(friendId)
              ? null
              : latestMomentByUser.get(
                  friendId
                ) ?? null
        };
      }
    );
  }

  static async removeFriend(
    userId: string,
    friendId: string
  ) {
    const friendship =
      await Friendship.findOneAndDelete({
        status: "accepted",
        $or: [
          {
            requester: userId,
            recipient: friendId
          },
          {
            requester: friendId,
            recipient: userId
          }
        ]
      });

    if (!friendship) {
      throw new ApiError(
        404,
        "Friendship not found"
      );
    }

    await User.updateMany(
      {
        _id: {
          $in: [
            friendship.requester,
            friendship.recipient
          ]
        },
        friendsCount: {
          $gt: 0
        }
      },
      {
        $inc: {
          friendsCount: -1
        }
      }
    );

    return {
      removed: true
    };
  }

  static async getPendingRequests(
    userId: string
  ) {
    const requests =
      await Friendship.find({
        recipient: userId,
        status: "pending"
      })
        .populate(
          "requester",
          "username avatar avatarEmoji"
        )
        .sort({
          createdAt: -1
        })
        .lean();

    return requests.map(
      (request: any) => ({
        _id: request._id.toString(),
        requesterId:
          request.requester?._id?.toString(),
        username:
          request.requester?.username,
        avatar: request.requester?.avatar,
        avatarEmoji:
          request.requester?.avatarEmoji || "🌸",
        createdAt: request.createdAt
      })
    );
  }
}
