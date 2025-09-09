import { Server, Socket } from "socket.io";
import { Message } from "@prisma/client";

export const registerChatHandlers = (io: Server, socket: Socket) => {
  socket.on("join_room", (roomId: string) => {
    socket.join(roomId);
  });
  socket.on("send_message", (roomId: string, message: Message) => {
    socket.broadcast.to(roomId).emit("new_message", message);
  });
};
