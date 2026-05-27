import { Moment } from "../../database/models/Moment.model.js";
import { Comment } from "../../database/models/Comment.model.js";
import { Reaction } from "../../database/models/Reaction.model.js";
import Notification from "../../database/models/Notification.model.js";
import mongoose from "mongoose";

export const MOMENT_LIFETIME_MS =
  24 * 60 * 60 * 1000;

let cleanupPromise:
  Promise<number> | null = null;
let indexPromise:
  Promise<void> | null = null;

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

export const deleteMomentsCascade =
  async (
    momentIds: mongoose.Types.ObjectId[]
  ) => {
    if (!momentIds.length) {
      return 0;
    }

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

    return momentIds.length;
  };

const cleanupExpiredMomentsBatch =
  async () => {
    await ensureMomentCreatedAtIndex();

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
        await cleanupDuplicateActiveMoments();
        await cleanupOrphanedMomentData();

        return totalDeleted;
      }

      const momentIds =
        expiredMoments.map(
          (moment) => moment._id
        );

      await deleteMomentsCascade(
        momentIds
      );

      totalDeleted +=
        momentIds.length;
    }
  };

const cleanupDuplicateActiveMoments =
  async () => {
    const duplicateGroups =
      await Moment.aggregate<{
        _id: mongoose.Types.ObjectId;
        ids: mongoose.Types.ObjectId[];
        count: number;
      }>([
        {
          $match: {
            createdAt: {
              $gte: getMomentExpiryCutoff()
            }
          }
        },
        {
          $sort: {
            user: 1,
            createdAt: -1
          }
        },
        {
          $group: {
            _id: "$user",
            ids: {
              $push: "$_id"
            },
            count: {
              $sum: 1
            }
          }
        },
        {
          $match: {
            count: {
              $gt: 1
            }
          }
        },
        {
          $limit: 100
        }
      ]);

    const duplicateIds =
      duplicateGroups.flatMap(
        (group) => group.ids.slice(1)
      );

    await deleteMomentsCascade(
      duplicateIds
    );
  };

const cleanupOrphanedMomentData =
  async () => {
    const [reactions, comments, notifications] =
      await Promise.all([
        Reaction.find({})
          .select("_id moment")
          .limit(500)
          .lean(),
        Comment.find({})
          .select("_id moment")
          .limit(500)
          .lean(),
        Notification.find({
          type: {
            $in: [
              "reaction",
              "comment",
              "moment"
            ]
          },
          entityId: {
            $ne: null
          }
        })
          .select("_id entityId")
          .limit(500)
          .lean()
      ]);

    const momentIds =
      [
        ...reactions.map(
          (reaction) => reaction.moment
        ),
        ...comments.map(
          (comment) => comment.moment
        ),
        ...notifications.map(
          (notification) =>
            notification.entityId
        )
      ].filter(Boolean);

    if (!momentIds.length) {
      return;
    }

    const existingMoments =
      await Moment.find({
        _id: {
          $in: momentIds
        }
      })
        .select("_id")
        .lean();

    const existingIds =
      new Set(
        existingMoments.map((moment) =>
          moment._id.toString()
        )
      );

    const orphanReactionIds =
      reactions
        .filter(
          (reaction) =>
            !existingIds.has(
              reaction.moment.toString()
            )
        )
        .map((reaction) => reaction._id);

    const orphanCommentIds =
      comments
        .filter(
          (comment) =>
            !existingIds.has(
              comment.moment.toString()
            )
        )
        .map((comment) => comment._id);

    const orphanNotificationIds =
      notifications
        .filter(
          (notification) =>
            notification.entityId &&
            !existingIds.has(
              notification.entityId.toString()
            )
        )
        .map((notification) => notification._id);

    await Promise.all([
      Reaction.deleteMany({
        _id: {
          $in: orphanReactionIds
        }
      }),
      Comment.deleteMany({
        _id: {
          $in: orphanCommentIds
        }
      }),
      Notification.deleteMany({
        _id: {
          $in: orphanNotificationIds
        }
      })
    ]);
  };

const ensureMomentCreatedAtIndex =
  async () => {
    if (indexPromise) {
      return indexPromise;
    }

    indexPromise = (async () => {
      const indexes =
        await Moment.collection.indexes();
      const createdAtIndex =
        indexes.find(
          (index) =>
            index.name === "createdAt_1" &&
            index.key?.createdAt === 1
        );

      if (
        createdAtIndex &&
        createdAtIndex.name &&
        typeof createdAtIndex.expireAfterSeconds ===
          "number"
      ) {
        await Moment.collection.dropIndex(
          createdAtIndex.name
        );
      }

      await Moment.collection.createIndex(
        {
          createdAt: 1
        },
        {
          background: true
        }
      );
    })().finally(() => {
      indexPromise = null;
    });

    return indexPromise;
  };
