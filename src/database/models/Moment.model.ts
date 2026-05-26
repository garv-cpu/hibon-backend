import mongoose, {
  Schema,
  InferSchemaType
} from "mongoose";

const momentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    text: {
      type: String,
      required: true,
      maxlength: 300
    },

    emoji: {
      type: String,
      required: true
    },

    prompt: {
      type: Schema.Types.ObjectId,
      ref: "Prompt",
      default: null
    },

    promptText: {
      type: String,
      default: null
    },

    promptTitle: {
      type: String,
      default: null
    },

    visibility: {
      type: String,
      enum: ["friends"],
      default: "friends"
    },

    reactionsCount: {
      type: Number,
      default: 0
    },

    commentsCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

momentSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 }
);

export type MomentDocument =
  InferSchemaType<typeof momentSchema>;

export const Moment =
  mongoose.models.Moment ||
  mongoose.model(
    "Moment",
    momentSchema
  );
