"use server";
import prisma from "@/lib/prisma";

export async function getRooms() {
  const rooms = await prisma.room.findMany({
    include: {
      host: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return rooms;
}
