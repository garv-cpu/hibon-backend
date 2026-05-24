import http from "http";

import app from "./app.js";

import { env } from "./config/env.js";

import { connectDB } from "./config/db.js";

import logger from "./config/logger.js";

import { initSocket } from "./sockets/socket.server.js";

const startServer = async () => {
  await connectDB();

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