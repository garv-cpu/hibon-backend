import mongoose, {
    Schema
} from "mongoose";

const promptSchema = new Schema(
    {
        title: {
            type: String,
            required: true
        },
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
        },

        weekday: {
            type: Number,
            required: true,
            min: 0,
            max: 6,
            unique: true
        },
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