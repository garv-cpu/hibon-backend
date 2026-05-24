import { Server } from "socket.io";

import { onlineUsers } from "./onlineUsers.js";

let io: Server;

export const initSocket = (
    server: any
) => {
    io = new Server(server, {
        cors: {
            origin:
                "http://localhost:5173",

            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log(
            "⚡ User connected:",
            socket.id
        );

        socket.on(
            "user:online",
            (userId: string) => {
                onlineUsers.set(
                    userId,
                    socket.id
                );

                io.emit(
                    "presence:update",
                    Array.from(
                        onlineUsers.keys()
                    )
                );
            }
        );

        socket.on(
            "disconnect",
            () => {
                for (const [
                    userId,
                    socketId
                ] of onlineUsers.entries()) {
                    if (
                        socketId === socket.id
                    ) {
                        onlineUsers.delete(
                            userId
                        );
                    }
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