import mongoose, {
  Schema
} from "mongoose";

const plusWaitlistSchema =
  new Schema(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
      }
    },
    {
      timestamps: true
    }
  );

export const PlusWaitlist =
  mongoose.models.PlusWaitlist ||
  mongoose.model(
    "PlusWaitlist",
    plusWaitlistSchema
  );
