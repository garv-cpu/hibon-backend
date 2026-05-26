import { Request, Response } from "express";

import Notification from "../../database/models/Notification.model.js";
import { PushToken } from "../../database/models/PushToken.model.js";

export const getNotifications = async (
  req: Request,
  res: Response
) => {

  const notifications =
    await Notification.find({
      recipient: req.userId
    })
      .populate(
        "sender",
        "username name avatarEmoji"
      )
      .sort({
        createdAt: -1
      });

  res.json({
    success: true,
    data: notifications
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

export const markAsRead = async (
  req: Request,
  res: Response
) => {

  await Notification.findByIdAndUpdate(
    req.params.id,
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
