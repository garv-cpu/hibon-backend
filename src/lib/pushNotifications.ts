import { PushToken } from "../database/models/PushToken.model.js";
import logger from "../config/logger.js";

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export const sendPushToUser =
  async (
    userId: string,
    payload: PushPayload
  ) => {
    const tokens =
      await PushToken.find({
        userId,
        isActive: true
      }).lean();

    if (tokens.length === 0) {
      return;
    }

    const messages =
      tokens.map((token) => ({
        to: token.token,
        sound: "default",
        title: payload.title,
        body: payload.body,
        data: payload.data || {}
      }));

    const response =
      await fetch(
      "https://exp.host/--/api/v2/push/send",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(messages)
      }
    );

    const result = await response.json().catch(
      () => null
    );

    if (!response.ok) {
      logger.error(
        {
          userId,
          status: response.status,
          result
        },
        "Expo push request failed"
      );
      return;
    }

    const ticketErrors =
      Array.isArray(result?.data)
        ? result.data.filter(
            (ticket: {
              status?: string;
            }) => ticket.status === "error"
          )
        : [];

    if (ticketErrors.length > 0) {
      logger.error(
        {
          userId,
          tokenCount: tokens.length,
          result
        },
        "Expo push ticket failed"
      );
      return;
    }

    logger.info(
      {
        userId,
        tokenCount: tokens.length,
        result
      },
      "Expo push request sent"
    );
  };
