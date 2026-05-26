import { Moment } from "../../database/models/Moment.model.js";
import { Comment } from "../../database/models/Comment.model.js";
import { Reaction } from "../../database/models/Reaction.model.js";
import Notification from "../../database/models/Notification.model.js";

export const MOMENT_LIFETIME_MS =
  24 * 60 * 60 * 1000;

let cleanupPromise:
  Promise<number> | null = null;

export const getMomentExpiryCutoff =
  () =>
    new Date(
      Date.now() - MOMENT_LIFETIME_MS
    );

export const cleanupExpiredMoments =
  async () => {
    if (cleanupPromise) {
      return cleanupPromise;
    }

    cleanupPromise =
      cleanupExpiredMomentsBatch().finally(
        () => {
          cleanupPromise = null;
        }
      );

    return cleanupPromise;
  };

const cleanupExpiredMomentsBatch =
  async () => {
    let totalDeleted = 0;

    while (true) {
      const expiredMoments =
        await Moment.find({
          createdAt: {
            $lt: getMomentExpiryCutoff()
          }
        })
          .select("_id")
          .limit(500)
          .lean();

      if (!expiredMoments.length) {
        return totalDeleted;
      }

      const momentIds =
        expiredMoments.map(
          (moment) => moment._id
        );

      const entityIds =
        momentIds.map((id) =>
          id.toString()
        );

      await Promise.all([
        Reaction.deleteMany({
          moment: {
            $in: momentIds
          }
        }),
        Comment.deleteMany({
          moment: {
            $in: momentIds
          }
        }),
        Notification.deleteMany({
          entityId: {
            $in: entityIds
          }
        }),
        Moment.deleteMany({
          _id: {
            $in: momentIds
          }
        })
      ]);

      totalDeleted +=
        momentIds.length;
    }
  };
