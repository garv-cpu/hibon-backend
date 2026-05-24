import mongoose, {
    Schema
} from "mongoose";

const reactionSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        moment: {
            type: Schema.Types.ObjectId,
            ref: "Moment",
            required: true
        },

        emoji: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

reactionSchema.index({
    user: 1,
    moment: 1
}, { unique: true });

export const Reaction =
    mongoose.models.Reaction ||
    mongoose.model(
        "Reaction",
        reactionSchema
    );