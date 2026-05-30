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
