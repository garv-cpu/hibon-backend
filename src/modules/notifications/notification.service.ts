import { Notification } from "../../database/models/Notification.model.js";

import { getIO } from "../../sockets/socket.server.js";

import { onlineUsers } from "../../sockets/onlineUsers.js";

export class NotificationService {
    static async createNotification({
        recipient,
        sender,
        type,
        title,
        message
    }: {
        recipient: string;

        sender?: string;

        type: string;

        title: string;

        message: string;
    }) {
        const notification =
            await Notification.create({
                recipient,
                sender,
                type,
                title,
                message
            });

        const io = getIO();

        const socketId =
            onlineUsers.get(recipient);

        if (socketId) {
            io.to(socketId).emit(
                "notification:new",
                notification
            );
        }

        return notification;
    }
}