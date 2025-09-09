export type RoomInput = {
  name: string;
  chatEnabled: boolean;
};

export type MessageInput = {
  roomId: string;
  senderId: string;
  content: string;
  username: string;
};
