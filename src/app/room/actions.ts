"use server";
import { RoomInput } from "@/types";
import { getSelf } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const createRoom = async (roomInput: RoomInput) => {
  try {
    console.log("Starting room creation with input:", roomInput);

    const user = await getSelf();
    if (!user) {
      console.error("User not found when trying to create room");
      throw new Error("User not found");
    }

    console.log("Creating room with user ID:", user.id);

    const slug = `${roomInput.name
      .toLowerCase()
      .replace(/\s+/g, "-")}-${Date.now()}`;
    console.log("Generated slug:", slug);

    const room = await prisma.room.create({
      data: {
        name: roomInput.name,
        slug: slug,
        hostId: user.id,
        chatEnabled: roomInput.chatEnabled,
      },
      select: {
        id: true,
        slug: true,
        joinCode: true,
      },
    });

    console.log("Room created successfully:", room);
    return room.slug;
  } catch (error) {
    console.error("Error in createRoom:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    throw error;
  }
};

export const getRoom = async (slug: string) => {
  const room = await prisma.room.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      isLive: true,
      hostId: true,
      joinCode: true,
      chatEnabled: true,
      createdAt: true,
      povs: true,
    },
  });
  if (!room) {
    throw new Error("Room not found");
  }
  return room;
};

export const getPovInfo = async (povId: string) => {
  const pov = await prisma.pov.findUnique({
    where: { id: povId },
    select: {
      id: true,
      label: true,
      userId: true,
      username: true,
      roomId: true,
    },
  });

  if (!pov) {
    throw new Error("POV not found");
  }

  revalidatePath(`/room/${pov.roomId}`);
  return {
    id: pov.id,
    label: pov.label,
    userId: pov.userId,
    username: pov.username,
  };
};

export const verifyJoinCode = async (joinCode: string, roomId: string) => {
  const room = await prisma.room.findUnique({
    where: {
      id: roomId,
    },
    select: {
      joinCode: true,
    },
  });
  if (!room) {
    return false;
  }
  return room.joinCode === joinCode;
};
