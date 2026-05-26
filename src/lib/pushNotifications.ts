import { PushToken } from "../database/models/PushToken.model.js";

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
  };
