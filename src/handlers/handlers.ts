import { Server, Socket } from "socket.io";
import { Message } from "@prisma/client";

export const registerHandlers = (io: Server, socket: Socket) => {
  socket.on("join_room", (roomId: string) => {
    socket.join(roomId);
  });

  socket.on("send_message", (roomId: string, message: Message) => {
    socket.broadcast.to(roomId).emit("new_message", message);
  });

  socket.on("delete_room", (roomId: string) => {
    io.to(roomId).emit("room_deleted", roomId);
    socket.leave(roomId);
  });
};
