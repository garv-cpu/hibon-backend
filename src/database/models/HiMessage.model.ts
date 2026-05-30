import mongoose, {
  Schema,
  InferSchemaType
} from "mongoose";

const hiMessageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    participants: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      required: true,
      index: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    expiresAt: {
      type: Date,
      required: true,
      index: {
        expireAfterSeconds: 0
      }
    },
    readAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

hiMessageSchema.index({
  participants: 1,
  createdAt: -1
});

hiMessageSchema.index({
  sender: 1,
  recipient: 1,
  createdAt: -1
});

export type HiMessageDocument =
  InferSchemaType<typeof hiMessageSchema>;

export const HiMessage =
  mongoose.models.HiMessage ||
  mongoose.model(
    "HiMessage",
    hiMessageSchema
  );
