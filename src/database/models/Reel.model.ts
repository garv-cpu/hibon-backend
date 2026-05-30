import mongoose, {
  Schema
} from "mongoose";

const reelSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },

    year: {
      type: Number,
      required: true
    },

    summary: {
      type: String,
      required: true
    },

    momentCount: {
      type: Number,
      default: 0
    },

    topMoods: {
      type: [String],
      default: []
    },

    isGenerated: {
      type: Boolean,
      default: true
    },

    generatedAt: {
      type: Date,
      default: Date.now
    },

    regenerationCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 3
    },

    moments: [
      {
        momentId: {
          type: Schema.Types.ObjectId,
          ref: "Moment"
        },
        text: {
          type: String,
          default: ""
        },
        emoji: {
          type: String,
          default: ""
        },
        createdAt: {
          type: Date,
          required: true
        },
        loggedDate: {
          type: Date,
          required: true
        }
      }
    ],

    moodBreakdown: {
      type: Map,
      of: Number,
      default: {}
    },

    longestStreak: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

reelSchema.index(
  {
    user: 1,
    month: 1,
    year: 1
  },
  {
    unique: true
  }
);

export const Reel =
  mongoose.models.Reel ||
  mongoose.model(
    "Reel",
    reelSchema
  );
