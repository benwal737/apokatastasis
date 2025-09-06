import { Server, Socket } from "socket.io";

export const handler = (io: Server, socket: Socket) => {
  console.log("Client connected", io.sockets.sockets);
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
};
