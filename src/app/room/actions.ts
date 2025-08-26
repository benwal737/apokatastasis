"use server";

import { RoomInput, Room } from "@/types";
import { getSelf } from "@/lib/auth-service";
import prisma from "@/lib/prisma";

export const createRoom = async (roomInput: RoomInput) => {
  const user = await getSelf();
  if (!user) {
    throw new Error("User not found");
  }
  const room = await prisma.room.create({
    data: {
      name: roomInput.name,
      slug: roomInput.name.toLowerCase().replace(/\s/g, "-"),
      hostId: user.id,
      chatEnabled: roomInput.chatEnabled,
    },
  });
  return room.slug;
};

export const getRoom = async (slug: string): Promise<Room | null> => {
  const room = await prisma.room.findUnique({
    where: {
      slug,
    },
    include: {
      povs: true,
    },
  });
  return room;
};
