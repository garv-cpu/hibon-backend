import { Server } from "socket.io";

import { onlineUsers } from "./onlineUsers.js";

import { User } from "../database/models/User.model.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

let io: Server;

export const initSocket = (
    server: any
) => {
    io = new Server(server, {
        cors: {
            origin:
                env.CLIENT_URL,

            credentials: true
        }
    });

    io.use((socket, next) => {
        try {
            const token =
                socket.handshake.auth
                    ?.token;

            if (!token) {
                throw new Error(
                    "Socket token missing"
                );
            }

            const decoded =
                jwt.verify(
                    token,
                    env.JWT_ACCESS_SECRET
                ) as {
                    userId: string;
                };

            socket.data.userId =
                decoded.userId;

            next();
        } catch {
            next(
                new Error(
                    "Socket authentication failed"
                )
            );
        }
    });

    io.on("connection", (socket) => {
        console.log(
            "⚡ User connected:",
            socket.id
        );

        const userId =
            socket.data.userId as string;

        const markOnline =
            async () => {
                onlineUsers.set(
                    userId,
                    socket.id
                );

                await User.findByIdAndUpdate(
                    userId,
                    {
                        isOnline: true
                    }
                );

                io.emit(
                    "presence:update",
                    Array.from(
                        onlineUsers.keys()
                    )
                );
            };

        markOnline();

        socket.on(
            "user:online",
            markOnline
        );

        socket.on(
            "disconnect",
            async () => {
                if (
                    onlineUsers.get(userId) ===
                    socket.id
                ) {
                    onlineUsers.delete(
                        userId
                    );

                    await User.findByIdAndUpdate(
                        userId,
                        {
                            isOnline: false,
                            lastSeenAt: new Date()
                        }
                    );
                }

                io.emit(
                    "presence:update",
                    Array.from(
                        onlineUsers.keys()
                    )
                );

                console.log(
                    "❌ User disconnected:",
                    socket.id
                );
            }
        );
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error(
            "Socket.io not initialized"
        );
    }

    return io;
};
