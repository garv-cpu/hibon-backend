import mongoose, {
  Schema
} from "mongoose";

const pushTokenSchema =
  new Schema(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
      },

      token: {
        type: String,
        required: true,
        unique: true
      },

      platform: {
        type: String,
        enum: ["ios", "android"],
        required: true
      },

      isActive: {
        type: Boolean,
        default: true
      }
    },
    {
      timestamps: true
    }
  );

pushTokenSchema.index({
  userId: 1,
  token: 1
});

export const PushToken =
  mongoose.models.PushToken ||
  mongoose.model(
    "PushToken",
    pushTokenSchema
  );
