import { Pov } from "@prisma/client";

export type RoomInput = {
  name: string;
  chatEnabled: boolean;
};

export type Room = {
  id: string;
  name: string;
  slug: string;
  isLive: boolean;
  hostId: string;
  createdAt: Date;
  joinCode: string;
  chatEnabled: boolean;
  povs: Pov[];
};
