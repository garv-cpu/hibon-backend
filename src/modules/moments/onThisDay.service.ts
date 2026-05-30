import { MomentLog } from "../../database/models/MomentLog.model.js";
import { User } from "../../database/models/User.model.js";
import { NotificationService } from "../notifications/notification.service.js";
import { sendPushToUser } from "../../lib/pushNotifications.js";

const dayMonthExpr = (
  date: Date
) => ({
  $and: [
    {
      $eq: [
        {
          $dayOfMonth: "$loggedAt"
        },
        date.getDate()
      ]
    },
    {
      $eq: [
        {
          $month: "$loggedAt"
        },
        date.getMonth() + 1
      ]
    },
    {
      $lt: [
        {
          $year: "$loggedAt"
        },
        date.getFullYear()
      ]
    }
  ]
});

export const getOnThisDayForUser =
  async (userId: string) => {
    const today = new Date();

    const logs =
      await MomentLog.find({
        user: userId,
        text: {
          $ne: ""
        },
        $expr: dayMonthExpr(today)
      })
        .sort({
          loggedAt: -1
        })
        .limit(5)
        .lean();

    const moments =
      logs.map((log) => ({
        _id:
          log._id.toString(),
        momentId:
          log.moment?.toString?.() ||
          null,
        text: log.text,
        emoji: log.emoji,
        createdAt: log.loggedAt,
        loggedDate: log.loggedAt,
        user: {
          _id: userId
        }
      }));

    return {
      hasMoments:
        moments.length > 0,
      moments,
      momentCount:
        moments.length,
      yearsAgo:
        Array.from(
          new Set(
            logs.map(
              (log) =>
                today.getFullYear() -
                new Date(
                  log.loggedAt
                ).getFullYear()
            )
          )
        )
    };
  };

export const sendOnThisDayNotifications =
  async () => {
    const today = new Date();

    const userGroups =
      await MomentLog.aggregate<{
        _id: string;
        moments: any[];
        count: number;
      }>([
        {
          $match: {
            text: {
              $ne: ""
            },
            $expr: dayMonthExpr(today)
          }
        },
        {
          $group: {
            _id: "$user",
            moments: {
              $push: "$$ROOT"
            },
            count: {
              $sum: 1
            }
          }
        }
      ]);

    for (const group of userGroups) {
      const user =
        await User.findById(group._id)
          .select("notificationPreferences")
          .lean();

      if (
        user?.notificationPreferences
          ?.weeklyDigest === false
      ) {
        continue;
      }

      const oldestMoment =
        group.moments.sort(
          (a, b) =>
            new Date(a.loggedAt).getTime() -
            new Date(b.loggedAt).getTime()
        )[0];

      if (!oldestMoment) continue;

      const yearsAgo =
        today.getFullYear() -
        new Date(
          oldestMoment.loggedAt
        ).getFullYear();
      const title =
        `${yearsAgo} year${yearsAgo > 1 ? "s" : ""} ago today`;
      const preview =
        `${oldestMoment.text.slice(0, 80)}${
          oldestMoment.text.length > 80
            ? "..."
            : ""
        }`;

      await NotificationService.createNotification({
        recipient:
          group._id.toString(),
        type: "ON_THIS_DAY",
        title,
        message: preview,
        entityId:
          oldestMoment.moment || undefined
      });

      await sendPushToUser(
        group._id.toString(),
        {
          title,
          body: `You noticed: "${preview}"`,
          data: {
            type: "ON_THIS_DAY",
            momentId:
              oldestMoment.moment?.toString?.() ||
              "",
            yearsAgo
          }
        }
      );
    }
  };
