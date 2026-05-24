import { Friendship } from "../../database/models/Friendship.model.js";

import { User } from "../../database/models/User.model.js";

import { ApiError } from "../../utils/ApiError.js";

export class FriendshipService {
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

    const existing =
      await Friendship.findOne({
        requester: requesterId,
        recipient: recipientId
      });

    if (existing) {
      throw new ApiError(
        400,
        "Request already exists"
      );
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
    return await Friendship.find({
      status: "accepted",

      $or: [
        { requester: userId },
        { recipient: userId }
      ]
    })
      .populate(
        "requester",
        "username avatar"
      )
      .populate(
        "recipient",
        "username avatar"
      );
  }
}