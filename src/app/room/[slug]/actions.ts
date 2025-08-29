"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export const getPovInfo = async (povId: string) => {
  const pov = await prisma.pov.findUnique({
    where: { id: povId },
    select: { id: true, label: true, userId: true, username: true, roomId: true },
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
