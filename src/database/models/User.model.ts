import mongoose, { Schema, InferSchemaType } from "mongoose";
import validator from "validator";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 30,
            unique: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            validate: [validator.isEmail, "Invalid email"]
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false
        },

        bio: {
            type: String,
            default: "",
            maxlength: 160
        },

        friendsCount: {
            type: Number,
            default: 0
        },

        currentStreak: {
            type: Number,
            default: 0
        },

        longestStreak: {
            type: Number,
            default: 0
        },

        lastMomentDate: {
            type: Date,
            default: null
        },

        timezone: {
            type: String,
            default: "Asia/Kolkata"
        },

        avatar: {
            type: String,
            default: ""
        },

        streakCount: {
            type: Number,
            default: 0
        },

        refreshToken: {
            type: String,
            default: null,
            select: false
        }
    },
    {
        timestamps: true
    }
);

export type UserDocument = InferSchemaType<typeof userSchema>;

export const User =
    mongoose.models.User ||
    mongoose.model("User", userSchema);