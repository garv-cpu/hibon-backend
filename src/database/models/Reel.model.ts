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
