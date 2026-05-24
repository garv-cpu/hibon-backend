import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";

import { errorMiddleware } from "./middleware/error.middleware.js";
import { notFoundMiddleware } from "./middleware/notFound.middleware.js";

import authRoutes from "./modules/auth/auth.routes.js";
import momentRoutes from "./modules/moments/moment.routes.js";
import friendshipRoutes from "./modules/friendships/friendship.routes.js";
import reactionRoutes from "./modules/reactions/reaction.routes.js";

const app = express();

app.use(helmet());

app.use(
    cors({
        origin: env.CLIENT_URL,
        credentials: true
    })
);

app.use(morgan("dev"));

app.use(express.json({ limit: "1mb" }));

app.use(cookieParser());

app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100
    })
);

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Hibon API running"
    });
});

// Routes
app.use("/api/v1/auth", authRoutes);
app.use(
    "/api/v1/moments",
    momentRoutes
);
app.use(
    "/api/v1/friends",
    friendshipRoutes
);
app.use(
    "/api/v1/reactions",
    reactionRoutes
);

app.use(notFoundMiddleware);

app.use(errorMiddleware);

export default app;