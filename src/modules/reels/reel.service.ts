import mongoose from "mongoose";

import { MomentLog } from "../../database/models/MomentLog.model.js";
import { Moment } from "../../database/models/Moment.model.js";
import { Reel } from "../../database/models/Reel.model.js";
import { User } from "../../database/models/User.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { getDateKey } from "../moments/helpers/date.helper.js";

interface GenerateReelInput {
  month: number;
  year: number;
}

const monthRange = (
  month: number,
  year: number
) => {
  const start =
    new Date(year, month - 1, 1);

  const end =
    new Date(year, month, 1);

  return {
    start,
    end
  };
};

const toMomentSnapshot = (
  log: any
) => ({
  _id:
    log.moment?.toString?.() ||
    log._id.toString(),
  momentId:
    log.moment ||
    undefined,
  text: log.text || "",
  emoji: log.emoji || "",
  createdAt:
    log.loggedAt ||
    log.createdAt,
  loggedDate:
    log.loggedAt ||
    log.createdAt
});

const toStoredMomentSnapshot = (
  moment: any
) => ({
  _id:
    moment.momentId?.toString?.() ||
    moment._id?.toString?.() ||
    "",
  momentId:
    moment.momentId,
  text: moment.text || "",
  emoji: moment.emoji || "",
  createdAt:
    moment.createdAt ||
    moment.loggedDate,
  loggedDate:
    moment.loggedDate ||
    moment.createdAt
});

const snapshotDayKey = (
  moment: ReturnType<typeof toMomentSnapshot>
) => {
  const date =
    moment.loggedDate ||
    moment.createdAt;

  if (!date) {
    return moment._id;
  }

  return new Date(date)
    .toISOString()
    .slice(0, 10);
};

const mergeMomentSnapshots = (
  primary: ReturnType<typeof toMomentSnapshot>[],
  fallback: ReturnType<typeof toMomentSnapshot>[]
) => {
  const byDay =
    new Map<
      string,
      ReturnType<typeof toMomentSnapshot>
    >();

  fallback.forEach((moment) => {
    byDay.set(
      snapshotDayKey(moment),
      moment
    );
  });

  primary.forEach((moment) => {
    byDay.set(
      snapshotDayKey(moment),
      moment
    );
  });

  return Array.from(byDay.values()).sort(
    (a, b) =>
      new Date(
        a.loggedDate ||
          a.createdAt ||
          0
      ).getTime() -
      new Date(
        b.loggedDate ||
          b.createdAt ||
          0
      ).getTime()
  );
};

const buildSummary = (
  moments: ReturnType<typeof toMomentSnapshot>[]
) =>
  moments.length > 0
    ? `This month held ${moments.length} good moment${moments.length === 1 ? "" : "s"}: ${moments
        .slice(0, 3)
        .map((moment) => moment.text)
        .filter(Boolean)
        .join(" ")}`
    : "A quiet month still counts. Your reel will grow as you share more good moments.";

const buildMoodBreakdown = (
  moments: ReturnType<typeof toMomentSnapshot>[]
) =>
  moments.reduce<Record<string, number>>(
    (breakdown, moment) => {
      if (!moment.emoji) return breakdown;

      breakdown[moment.emoji] =
        (breakdown[moment.emoji] || 0) + 1;

      return breakdown;
    },
    {}
  );

const topMoodsFromBreakdown = (
  breakdown: Record<string, number>
) =>
  Object.entries(breakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([mood]) => mood)
    .slice(0, 5);

const enrichReel = async (
  reel: any
) => {
  const {
    start,
    end
  } = monthRange(
    reel.month,
    reel.year
  );

  const logs =
    await MomentLog.find({
      user: reel.user,
      loggedAt: {
        $gte: start,
        $lt: end
      }
    })
      .sort({
        loggedAt: 1
      })
      .limit(31)
      .lean();

  const moments =
    mergeMomentSnapshots(
      logs.map(toMomentSnapshot),
      (reel.moments || []).map(
        toStoredMomentSnapshot
      )
    );

  const moodBreakdown =
    Object.fromEntries(
      reel.moodBreakdown instanceof Map
        ? reel.moodBreakdown
        : Object.entries(
            reel.moodBreakdown || {}
          )
    );

  const computedBreakdown =
    Object.keys(moodBreakdown).length
      ? moodBreakdown
      : buildMoodBreakdown(moments);

  return {
    ...reel,
    _id: reel._id.toString(),
    moments,
    moodBreakdown:
      computedBreakdown,
    longestStreak:
      reel.longestStreak || 0,
    isGenerated:
      reel.isGenerated !== false,
    generatedAt:
      reel.generatedAt ||
      reel.updatedAt,
    regenerationCount:
      reel.regenerationCount || 0,
    firstMoment:
      moments[0] || null,
    lastMoment:
      moments[moments.length - 1] ||
      null
  };
};

const backfillMomentLogsForMonth =
  async (
    userId: string,
    month: number,
    year: number
  ) => {
    const user =
      await User.findById(userId)
        .select("timezone")
        .lean();
    const timezone =
      user?.timezone || "UTC";
    const {
      start,
      end
    } = monthRange(month, year);

    const moments =
      await Moment.find({
        user: userId,
        createdAt: {
          $gte: start,
          $lt: end
        }
      })
        .select("_id text emoji createdAt")
        .lean();

    if (!moments.length) {
      return;
    }

    await MomentLog.bulkWrite(
      moments.map((moment: any) => ({
        updateOne: {
          filter: {
            user: userId,
            loggedDateKey:
              getDateKey(
                moment.createdAt,
                timezone
              )
          },
          update: {
            $set: {
              moment: moment._id,
              text: moment.text || "",
              emoji: moment.emoji || "",
              loggedAt: moment.createdAt,
              timezone
            },
            $setOnInsert: {
              user: userId,
              loggedDateKey:
                getDateKey(
                  moment.createdAt,
                  timezone
                )
            }
          },
          upsert: true
        }
      })),
      {
        ordered: false
      }
    );
  };

export class ReelService {
  static async getMyReels(
    userId: string
  ) {
    const reels =
      await Reel.find({
        user: userId
      })
        .sort({
          year: -1,
          month: -1
        })
        .lean();

    return Promise.all(
      reels.map(enrichReel)
    );
  }

  static async getById(
    userId: string,
    reelId: string
  ) {
    if (
      !mongoose.Types.ObjectId.isValid(
        reelId
      )
    ) {
      throw new ApiError(404, "Reel not found");
    }

    const reel =
      await Reel.findById(reelId).lean();

    if (!reel) {
      throw new ApiError(404, "Reel not found");
    }

    if (
      reel.user.toString() !== userId
    ) {
      throw new ApiError(403, "Reel is private");
    }

    return enrichReel(reel);
  }

  static async generate(
    userId: string,
    { month, year }: GenerateReelInput
  ) {
    await backfillMomentLogsForMonth(
      userId,
      month,
      year
    );

    const user =
      await User.findById(userId)
        .select("longestStreak")
        .lean();
    const {
      start,
      end
    } = monthRange(month, year);

    const logs =
      await MomentLog.find({
        user: userId,
        loggedAt: {
          $gte: start,
          $lt: end
        }
      })
        .sort({
          loggedAt: 1
        })
        .limit(31)
        .lean();

    const existingReel =
      await Reel.findOne({
        user: userId,
        month,
        year
      })
        .select("moments regenerationCount")
        .lean();

    const moments =
      mergeMomentSnapshots(
        logs.map(toMomentSnapshot),
        (existingReel?.moments || []).map(
          toStoredMomentSnapshot
        )
      );
    const moodBreakdown =
      buildMoodBreakdown(moments);
    const topMoods =
      topMoodsFromBreakdown(
        moodBreakdown
      );
    const summary =
      buildSummary(moments);

    const reel =
      await Reel.findOneAndUpdate(
        {
          user: userId,
          month,
          year
        },
        {
          user: userId,
          month,
          year,
          summary,
          momentCount:
            moments.length,
          topMoods,
          moments,
          moodBreakdown,
          longestStreak:
            user?.longestStreak || 0,
          isGenerated: true,
          generatedAt: new Date()
        },
        {
          upsert: true,
          returnDocument: "after",
          runValidators: true
        }
      ).lean();

    return reel
      ? enrichReel(reel)
      : null;
  }

  static async regenerate(
    userId: string,
    reelId: string
  ) {
    const existing =
      await this.getById(
        userId,
        reelId
      );

    if (
      existing.regenerationCount >= 3
    ) {
      throw new ApiError(
        429,
        "Max regenerations reached"
      );
    }

    const reel =
      await this.generate(userId, {
        month: existing.month,
        year: existing.year
      });

    await Reel.findByIdAndUpdate(
      reelId,
      {
        $inc: {
          regenerationCount: 1
        }
      },
      {
        runValidators: true
      }
    );

    return this.getById(
      userId,
      reelId
    );
  }
}
