import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { TranslationService } from "./translation.service.js";

export const translateText =
  asyncHandler(async (req, res) => {
    const result =
      await TranslationService.translate(
        req.body
      );

    res.json(
      new ApiResponse(
        "Translation ready",
        result
      )
    );
  });
