import http from "http";

import app from "./app.js";

import { env } from "./config/env.js";

import { connectDB } from "./config/db.js";

import logger from "./config/logger.js";

import { initSocket } from "./sockets/socket.server.js";

import { cleanupExpiredMoments } from "./modules/moments/moment.expiry.js";

const startServer = async () => {
  await connectDB();

  await cleanupExpiredMoments();

  const expiryInterval =
    setInterval(
      () => {
        cleanupExpiredMoments().catch(
          (error) => {
            logger.error(
              error,
              "Failed to clean expired moments"
            );
          }
        );
      },
      60 * 60 * 1000
    );

  expiryInterval.unref();

  const server =
    http.createServer(app);

  initSocket(server);

  server.listen(env.PORT, () => {
    logger.info(
      `🚀 Server running on port ${env.PORT}`
    );
  });

  const shutdown = (signal: NodeJS.Signals) => {
    logger.info({ signal }, "Shutdown signal received");

    server.close((error) => {
      if (error) {
        logger.error(error, "Failed to close HTTP server cleanly");
        process.exit(1);
      }

      logger.info("HTTP server closed cleanly");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
};

startServer().catch((error) => {
  logger.error(error, "Failed to start server");
  process.exit(1);
});
