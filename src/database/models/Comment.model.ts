import mongoose, {
  Schema
} from "mongoose";

const commentSchema =
  new Schema(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
      },

      moment: {
        type: Schema.Types.ObjectId,
        ref: "Moment",
        required: true
      },

      text: {
        type: String,
        required: true,
        trim: true,
        maxlength: 240
      }
    },
    {
      timestamps: true
    }
  );

commentSchema.index({
  moment: 1,
  createdAt: 1
});

export const Comment =
  mongoose.models.Comment ||
  mongoose.model(
    "Comment",
    commentSchema
  );
