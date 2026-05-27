import mongoose from "mongoose";
import { env } from "./env.js";
import logger from "./logger.js";

export const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);

    await mongoose.connection
      .collection("users")
      .updateMany(
        {
          "discoverLocation.approximate": {
            $exists: true
          },
          "discoverLocation.approximate.coordinates.0": {
            $exists: false
          }
        },
        {
          $unset: {
            "discoverLocation.approximate": ""
          }
        }
      );

    logger.info("✅ MongoDB connected");
  } catch (error) {
    logger.error(error);

    process.exit(1);
  }
};
