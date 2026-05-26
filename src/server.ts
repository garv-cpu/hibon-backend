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
};

startServer();
