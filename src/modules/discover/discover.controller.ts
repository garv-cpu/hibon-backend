import { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { DiscoverService } from "./discover.service.js";

const num = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed
    : undefined;
};

export const updateDiscoverLocation =
  asyncHandler(async (req: Request, res: Response) => {
    const result =
      await DiscoverService.updateLocation(
        req.userId!,
        {
          latitude: num(req.body.latitude),
          longitude: num(req.body.longitude),
          city: req.body.city,
          region: req.body.region,
          country: req.body.country
        }
      );

    res.json(
      new ApiResponse(
        "Discover location updated",
        result
      )
    );
  });

export const searchUsers =
  asyncHandler(async (req: Request, res: Response) => {
    const result =
      await DiscoverService.search(
        req.userId!,
        String(req.query.q || ""),
        Math.min(Number(req.query.limit) || 20, 40),
        Number(req.query.cursor) || 0
      );

    res.json(
      new ApiResponse(
        "Users searched",
        result
      )
    );
  });

export const nearbyUsers =
  asyncHandler(async (req: Request, res: Response) => {
    const result =
      await DiscoverService.nearby(
        req.userId!,
        {
          latitude: num(req.query.latitude),
          longitude: num(req.query.longitude),
          city: String(req.query.city || ""),
          region: String(req.query.region || ""),
          country: String(req.query.country || "")
        },
        Math.min(Number(req.query.limit) || 12, 24)
      );

    res.json(
      new ApiResponse(
        "Nearby users fetched",
        result
      )
    );
  });
