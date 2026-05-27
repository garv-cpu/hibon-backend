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

        name: {
            type: String,
            trim: true,
            maxlength: 50,
            default: ""
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

        avatarEmoji: {
            type: String,
            default: "🌸"
        },

        streakCount: {
            type: Number,
            default: 0
        },

        hasCompletedOnboarding: {
            type: Boolean,
            default: true
        },

        refreshToken: {
            type: String,
            default: null,
            select: false
        },
        phoneNumber: {
            type: String,
            unique: true,
            sparse: true
        },

        phoneHash: {
            type: String,
            unique: true,
            sparse: true
        },

        isOnline: {
            type: Boolean,
            default: false
        },

        lastSeenAt: {
            type: Date
        },

        notificationPreferences: {
            friendRequests: {
                type: Boolean,
                default: true
            },
            reactions: {
                type: Boolean,
                default: true
            },
            streakReminders: {
                type: Boolean,
                default: true
            },
            reminderTime: {
                type: String,
                default: "20:00"
            },
            weeklyDigest: {
                type: Boolean,
                default: true
            },
            momentPosted: {
                type: Boolean,
                default: true
            }
        },

        preferences: {
            theme: {
                type: String,
                enum: [
                    "system",
                    "dark",
                    "light"
                ],
                default: "dark"
            },
            accentColor: {
                type: String,
                default: "#F5A623"
            },
            fontScale: {
                type: Number,
                default: 1
            },
            language: {
                type: String,
                enum: [
                    "en",
                    "hi",
                    "es"
                ],
                default: "en"
            }
        },

        privacy: {
            profileVisibility: {
                type: String,
                enum: [
                    "friends",
                    "private"
                ],
                default: "friends"
            },
            showInSearch: {
                type: Boolean,
                default: true
            },
            allowFriendRequests: {
                type: Boolean,
                default: true
            }
        },

        blockedUsers: [
            {
                type: Schema.Types.ObjectId,
                ref: "User"
            }
        ]
    },
    {
        timestamps: true
    }
);

export type UserDocument = InferSchemaType<typeof userSchema>;

export const User =
    mongoose.models.User ||
    mongoose.model("User", userSchema);
