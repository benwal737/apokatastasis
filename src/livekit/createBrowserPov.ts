"use server";

import prisma from "@/lib/prisma";
import { AccessToken } from "livekit-server-sdk";
import { getSelf } from "@/lib/auth";

export async function createBrowserPov(roomId: string, label?: string) {
  // TODO: enforce join-code
  const self = await getSelf();
  if (!self) throw new Error("Unauthorized");

  const pov = await prisma.pov.create({
    data: {
      roomId,
      label: label?.trim() || "Browser POV",
      userId: self?.id,
      username: self?.username,
    },
    select: { id: true, label: true },
  });

  const apiKey = process.env.LIVEKIT_API_KEY!;
  const apiSecret = process.env.LIVEKIT_API_SECRET!;
  const at = new AccessToken(apiKey, apiSecret, {
    identity: pov.id,
    name: pov.label ?? "POV",
  });
  at.addGrant({
    room: roomId,
    roomJoin: true,
    canSubscribe: true,
    canPublish: true,
  });

  const token = await at.toJwt();
  return { povId: pov.id, token, label: pov.label };
}
