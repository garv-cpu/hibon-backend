import mongoose, {
    Schema
} from "mongoose";

const friendshipSchema = new Schema(
    {
        requester: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        recipient: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        status: {
            type: String,
            enum: [
                "pending",
                "accepted",
                "rejected"
            ],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

friendshipSchema.index(
    {
        requester: 1,
        recipient: 1
    },
    {
        unique: true
    }
);

export const Friendship =
    mongoose.models.Friendship ||
    mongoose.model(
        "Friendship",
        friendshipSchema
    );