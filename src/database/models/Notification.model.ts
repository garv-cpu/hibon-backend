import mongoose, {
    Schema
} from "mongoose";

const notificationSchema =
    new Schema(
        {
            recipient: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true
            },

            sender: {
                type: Schema.Types.ObjectId,
                ref: "User",
                default: null
            },

            type: {
                type: String,
                enum: [
                    "friend_request",
                    "friend_accept",
                    "reaction",
                    "streak_reminder"
                ],

                required: true
            },

            title: {
                type: String,
                required: true
            },

            message: {
                type: String,
                required: true
            },

            read: {
                type: Boolean,
                default: false
            }
        },
        {
            timestamps: true
        }
    );

export const Notification =
    mongoose.models.Notification ||
    mongoose.model(
        "Notification",
        notificationSchema
    );