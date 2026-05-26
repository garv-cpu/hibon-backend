import { Moment } from "../../database/models/Moment.model.js";
import { Reel } from "../../database/models/Reel.model.js";

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

export class ReelService {
  static async getMyReels(
    userId: string
  ) {
    return Reel.find({
      user: userId
    })
      .sort({
        year: -1,
        month: -1
      })
      .lean();
  }

  static async generate(
    userId: string,
    { month, year }: GenerateReelInput
  ) {
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
        .sort({
          createdAt: 1
        })
        .lean();

    const topMoods =
      Array.from(
        new Set(
          moments
            .map((moment) => moment.emoji)
            .filter(Boolean)
        )
      ).slice(0, 5);

    const summary =
      moments.length > 0
        ? `This month held ${moments.length} good moment${moments.length === 1 ? "" : "s"}: ${moments
            .slice(0, 3)
            .map((moment) => moment.text)
            .join(" ")}`
        : "A quiet month still counts. Your reel will grow as you share more good moments.";

    return Reel.findOneAndUpdate(
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
        momentCount: moments.length,
        topMoods
      },
      {
        upsert: true,
        new: true,
        runValidators: true
      }
    );
  }
}
