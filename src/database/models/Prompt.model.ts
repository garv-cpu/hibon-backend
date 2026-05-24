import mongoose, {
    Schema
} from "mongoose";

const promptSchema = new Schema(
    {
        text: {
            type: String,
            required: true
        },

        active: {
            type: Boolean,
            default: true
        },

        festival: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

export const Prompt =
    mongoose.models.Prompt ||
    mongoose.model(
        "Prompt",
        promptSchema
    );