import { Types } from "mongoose";

import { User } from "../../database/models/User.model.js";
import { Friendship } from "../../database/models/Friendship.model.js";

interface DiscoverUserDoc {
  _id: Types.ObjectId;
  username: string;
  name?: string;
  bio?: string;
  avatar?: string;
  avatarEmoji?: string;
  discoverLocation?: {
    city?: string;
    region?: string;
    country?: string;
  };
  distanceMeters?: number;
}

interface LocationInput {
  latitude?: number;
  longitude?: number;
  city?: string;
  region?: string;
  country?: string;
}

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const distanceLabel = (meters?: number, city?: string, region?: string) => {
  if (typeof meters === "number") {
    if (meters < 1000) return "near you";
    if (meters < 10000) return `${Math.round(meters / 1000)} km away`;
    return "same region";
  }

  if (city) return city;
  if (region) return region;
  return "nearby";
};

export class DiscoverService {
  private static async relationshipMap(
    viewerId: string,
    userIds: string[]
  ) {
    const friendships =
      await Friendship.find({
        $or: [
          {
            requester: viewerId,
            recipient: {
              $in: userIds
            }
          },
          {
            requester: {
              $in: userIds
            },
            recipient: viewerId
          }
        ]
      })
        .select("requester recipient status")
        .lean();

    const map = new Map<string, "friends" | "requested" | "incoming" | "none">();

    friendships.forEach((friendship) => {
      const requester =
        friendship.requester.toString();
      const recipient =
        friendship.recipient.toString();
      const other =
        requester === viewerId
          ? recipient
          : requester;

      if (friendship.status === "accepted") {
        map.set(other, "friends");
      } else if (friendship.status === "pending") {
        map.set(
          other,
          requester === viewerId
            ? "requested"
            : "incoming"
        );
      }
    });

    return map;
  }

  private static async blockedSets(viewerId: string) {
    const [viewer, usersBlockingViewer] =
      await Promise.all([
        User.findById(viewerId)
          .select("blockedUsers")
          .lean(),
        User.find({
          blockedUsers: viewerId
        })
          .select("_id")
          .lean()
      ]);

    return new Set<string>([
      viewerId,
      ...((viewer?.blockedUsers || []) as Types.ObjectId[])
        .map((id) => id.toString()),
      ...usersBlockingViewer.map((user) =>
        user._id.toString()
      )
    ]);
  }

  private static async shapeUsers(
    viewerId: string,
    users: DiscoverUserDoc[]
  ) {
    const ids =
      users.map((user) => user._id.toString());
    const relationships =
      await this.relationshipMap(viewerId, ids);

    return users.map((user) => {
      const id = user._id.toString();
      const state =
        relationships.get(id) || "none";

      return {
        _id: id,
        username: user.username,
        name: user.name || user.username,
        bio: user.bio || "",
        avatar: user.avatar || "",
        avatarEmoji:
          user.avatarEmoji || "\uD83C\uDF38",
        friendshipStatus: state,
        isFriend: state === "friends",
        hasPendingRequest: state === "requested",
        hasIncomingRequest: state === "incoming",
        distanceLabel: distanceLabel(
          user.distanceMeters,
          user.discoverLocation?.city,
          user.discoverLocation?.region
        )
      };
    });
  }

  static async updateLocation(
    viewerId: string,
    input: LocationInput
  ) {
    const longitude =
      typeof input.longitude === "number"
        ? Number(input.longitude.toFixed(2))
        : undefined;
    const latitude =
      typeof input.latitude === "number"
        ? Number(input.latitude.toFixed(2))
        : undefined;

    await User.findByIdAndUpdate(viewerId, {
      discoverLocation: {
        city: input.city?.trim() || "",
        region: input.region?.trim() || "",
        country: input.country?.trim() || "",
        approximate:
          typeof longitude === "number" &&
          typeof latitude === "number"
            ? {
                type: "Point",
                coordinates: [
                  longitude,
                  latitude
                ]
              }
            : undefined,
        updatedAt: new Date()
      }
    });

    return {
      saved: true
    };
  }

  static async search(
    viewerId: string,
    query: string,
    limit = 20,
    cursor = 0
  ) {
    const term =
      query.trim().toLowerCase();

    if (term.length < 2) {
      return {
        users: [],
        nextCursor: null
      };
    }

    const blocked =
      await this.blockedSets(viewerId);
    const regex =
      new RegExp(escapeRegex(term), "i");

    const users =
      await User.find({
        _id: {
          $nin: Array.from(blocked)
        },
        "privacy.showInSearch": {
          $ne: false
        },
        "privacy.allowFriendRequests": {
          $ne: false
        },
        $or: [
          {
            username: regex
          },
          {
            name: regex
          }
        ]
      })
        .select("username name bio avatar avatarEmoji discoverLocation")
        .sort({
          username: 1
        })
        .skip(cursor)
        .limit(limit + 1)
        .lean<DiscoverUserDoc[]>();

    const hasNext =
      users.length > limit;
    const page =
      hasNext
        ? users.slice(0, limit)
        : users;

    return {
      users: await this.shapeUsers(viewerId, page),
      nextCursor: hasNext
        ? cursor + limit
        : null
    };
  }

  static async nearby(
    viewerId: string,
    input: LocationInput,
    limit = 12
  ) {
    const blocked =
      await this.blockedSets(viewerId);
    const baseMatch = {
      _id: {
        $nin: Array.from(blocked).map(
          (id) => new Types.ObjectId(id)
        )
      },
      "privacy.showInSearch": {
        $ne: false
      },
      "privacy.allowFriendRequests": {
        $ne: false
      }
    };

    let users: DiscoverUserDoc[] = [];

    if (
      typeof input.longitude === "number" &&
      typeof input.latitude === "number"
    ) {
      users =
        await User.aggregate<DiscoverUserDoc>([
          {
            $geoNear: {
              near: {
                type: "Point",
                coordinates: [
                  Number(input.longitude.toFixed(2)),
                  Number(input.latitude.toFixed(2))
                ]
              },
              distanceField: "distanceMeters",
              maxDistance: 75000,
              spherical: true,
              query: baseMatch
            }
          },
          {
            $project: {
              username: 1,
              name: 1,
              bio: 1,
              avatar: 1,
              avatarEmoji: 1,
              discoverLocation: 1,
              distanceMeters: 1
            }
          },
          {
            $limit: limit
          }
        ]);
    }

    if (users.length === 0) {
      users =
        await User.find({
          ...baseMatch,
          $or: [
            {
              "discoverLocation.city":
                input.city || ""
            },
            {
              "discoverLocation.region":
                input.region || ""
            }
          ]
        })
          .select("username name bio avatar avatarEmoji discoverLocation")
          .limit(limit)
          .lean<DiscoverUserDoc[]>();
    }

    return {
      users: await this.shapeUsers(viewerId, users)
    };
  }
}
