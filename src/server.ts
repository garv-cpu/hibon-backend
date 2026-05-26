import http from "node:http";
import { webcrypto } from "node:crypto";

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true
  });
}

const startServer = async () => {
  const [
    { default: app },
    { env },
    { connectDB },
    { default: logger },
    { initSocket },
    { cleanupExpiredMoments }
  ] = await Promise.all([
    import("./app.js"),
    import("./config/env.js"),
    import("./config/db.js"),
    import("./config/logger.js"),
    import("./sockets/socket.server.js"),
    import("./modules/moments/moment.expiry.js")
  ]);

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
  console.error(error);
  process.exit(1);
});
