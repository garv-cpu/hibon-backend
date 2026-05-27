import { Request, Response } from "express";

import Notification from "../../database/models/Notification.model.js";
import { PushToken } from "../../database/models/PushToken.model.js";

export const getNotifications = async (
  req: Request,
  res: Response
) => {
  const limit =
    Math.min(
      Number(req.query.limit) || 20,
      50
    );
  const cursor =
    typeof req.query.cursor === "string"
      ? req.query.cursor
      : null;

  const notifications =
    await Notification.find({
      recipient: req.userId,
      ...(cursor
        ? {
            createdAt: {
              $lt: new Date(cursor)
            }
          }
        : {})
    })
      .populate(
        "sender",
        "username name avatar avatarEmoji"
      )
      .sort({
        createdAt: -1
      })
      .limit(limit + 1)
      .lean();

  const hasNextPage =
    notifications.length > limit;
  const page =
    hasNextPage
      ? notifications.slice(0, limit)
      : notifications;

  const shaped =
    page.map((notification: any) => ({
      _id: notification._id.toString(),
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: {
        entityId:
          notification.entityId?.toString?.() ||
          notification.entityId
      },
      isRead: notification.read,
      read: notification.read,
      createdAt: notification.createdAt,
      sender: notification.sender
        ? {
            _id: notification.sender._id?.toString(),
            username: notification.sender.username,
            avatarEmoji: notification.sender.avatarEmoji,
            avatar: notification.sender.avatar
          }
        : null
    }));

  res.json({
    success: true,
    data: shaped,
    nextCursor: hasNextPage
      ? page[page.length - 1]?.createdAt?.toISOString()
      : null
  });
};

export const getUnreadCount = async (
  req: Request,
  res: Response
) => {
  const count =
    await Notification.countDocuments({
      recipient: req.userId,
      read: false
    });

  res.json({
    success: true,
    data: {
      count
    }
  });
};

export const markAllAsRead = async (
  req: Request,
  res: Response
) => {

  await Notification.updateMany(
    {
      recipient: req.userId,
      read: false
    },
    {
      read: true
    }
  );

  res.json({
    success: true
  });
};

export const clearNotifications = async (
  req: Request,
  res: Response
) => {
  await Notification.deleteMany({
    recipient: req.userId
  });

  res.json({
    success: true
  });
};

export const markAsRead = async (
  req: Request,
  res: Response
) => {

  await Notification.findOneAndUpdate(
    {
      _id: req.params.id,
      recipient: req.userId
    },
    {
      read: true
    }
  );

  res.json({
    success: true
  });
};

export const savePushToken = async (
  req: Request,
  res: Response
) => {
  const {
    token,
    platform
  } = req.body;

  await PushToken.findOneAndUpdate(
    {
      token
    },
    {
      userId: req.userId,
      token,
      platform,
      isActive: true
    },
    {
      upsert: true,
      new: true,
      runValidators: true
    }
  );

  res.json({
    success: true
  });
};
