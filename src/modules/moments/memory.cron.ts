import logger from "../../config/logger.js";
import {
  sendOnThisDayNotifications
} from "./onThisDay.service.js";

const DAY_MS =
  24 * 60 * 60 * 1000;

const msUntilNextNineUtc = () => {
  const now = new Date();
  const next =
    new Date(now);

  next.setUTCHours(
    9,
    0,
    0,
    0
  );

  if (next <= now) {
    next.setUTCDate(
      next.getUTCDate() + 1
    );
  }

  return next.getTime() - now.getTime();
};

export const scheduleMemoryJobs =
  () => {
    const timeout =
      setTimeout(() => {
        sendOnThisDayNotifications().catch(
          (error) =>
            logger.error(
              error,
              "Failed to send on-this-day notifications"
            )
        );

        const interval =
          setInterval(() => {
            sendOnThisDayNotifications().catch(
              (error) =>
                logger.error(
                  error,
                  "Failed to send on-this-day notifications"
                )
            );
          }, DAY_MS);

        interval.unref();
      }, msUntilNextNineUtc());

    timeout.unref();
  };
