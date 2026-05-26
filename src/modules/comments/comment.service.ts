import { Comment } from "../../database/models/Comment.model.js";
import { Moment } from "../../database/models/Moment.model.js";
import { ApiError } from "../../utils/ApiError.js";
import {
  cleanupExpiredMoments,
  getMomentExpiryCutoff
} from "../moments/moment.expiry.js";

export class CommentService {
  static async createComment(
    userId: string,
    momentId: string,
    text: string
  ) {
    await cleanupExpiredMoments();

    const moment =
      await Moment.findById(momentId);

    if (
      !moment ||
      moment.createdAt <
        getMomentExpiryCutoff()
    ) {
      throw new ApiError(
        404,
        "Moment not found"
      );
    }

    const comment =
      await Comment.create({
        user: userId,
        moment: momentId,
        text
      });

    moment.commentsCount += 1;
    await moment.save();

    return Comment.findById(comment._id)
      .populate(
        "user",
        "username name avatar avatarEmoji"
      )
      .lean();
  }

  static async getMomentComments(
    momentId: string
  ) {
    await cleanupExpiredMoments();

    const moment =
      await Moment.findOne({
        _id: momentId,
        createdAt: {
          $gte: getMomentExpiryCutoff()
        }
      })
        .select("_id")
        .lean();

    if (!moment) {
      throw new ApiError(
        404,
        "Moment not found"
      );
    }

    return Comment.find({
      moment: momentId
    })
      .populate(
        "user",
        "username name avatar avatarEmoji"
      )
      .sort({
        createdAt: 1
      })
      .lean();
  }
}
