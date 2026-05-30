// modules/notifications/notification.model.js

import mongoose from "mongoose";

const notificationSchema =
  new mongoose.Schema(
    {
      recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },

      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },

      type: {
        type: String,
        enum: [
          "reaction",
          "friend_request",
          "friend_accept",
          "friend_reject",
          "comment",
          "mention",
          "message",
          "nudge",
          "moment",
          "ON_THIS_DAY",
          "streak",
          "reel"
        ],
        required: true
      },

      title: String,

      body: String,

      read: {
        type: Boolean,
        default: false
      },

      entityId: mongoose.Schema.Types.ObjectId
    },
    {
      timestamps: true
    }
  );

export default mongoose.model(
  "Notification",
  notificationSchema
);
