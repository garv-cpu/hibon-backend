import { Comment } from "../../database/models/Comment.model.js";
import { Moment } from "../../database/models/Moment.model.js";
import { ApiError } from "../../utils/ApiError.js";

export class CommentService {
  static async createComment(
    userId: string,
    momentId: string,
    text: string
  ) {
    const moment =
      await Moment.findById(momentId);

    if (!moment) {
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
        "username name avatarEmoji"
      )
      .lean();
  }

  static async getMomentComments(
    momentId: string
  ) {
    return Comment.find({
      moment: momentId
    })
      .populate(
        "user",
        "username name avatarEmoji"
      )
      .sort({
        createdAt: 1
      })
      .lean();
  }
}
