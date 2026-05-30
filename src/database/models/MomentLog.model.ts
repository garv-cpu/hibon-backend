import mongoose, {
  Schema,
  InferSchemaType
} from "mongoose";

const momentLogSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    moment: {
      type: Schema.Types.ObjectId,
      ref: "Moment"
    },
    loggedDateKey: {
      type: String,
      required: true
    },
    loggedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    timezone: {
      type: String,
      default: "UTC"
    },
    text: {
      type: String,
      default: "",
      maxlength: 300
    },
    emoji: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

momentLogSchema.index(
  {
    user: 1,
    loggedDateKey: 1
  },
  {
    unique: true
  }
);

momentLogSchema.index({
  user: 1,
  loggedAt: -1
});

export type MomentLogDocument =
  InferSchemaType<typeof momentLogSchema>;

export const MomentLog =
  mongoose.models.MomentLog ||
  mongoose.model(
    "MomentLog",
    momentLogSchema
  );
