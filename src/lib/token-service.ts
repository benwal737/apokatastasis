"use server";

import { AccessToken } from "livekit-server-sdk";

export async function getViewerToken({
  roomName,
  identity,
}: {
  roomName: string;
  identity?: string;
}) {
  const apiKey = process.env.LIVEKIT_API_KEY!;
  const apiSecret = process.env.LIVEKIT_API_SECRET!;
  if (!apiKey || !apiSecret) throw new Error("Missing LiveKit credentials");

  const at = new AccessToken(apiKey, apiSecret, {
    identity: identity ?? `viewer-${crypto.randomUUID()}`,
  });
  at.addGrant({ roomJoin: true, room: roomName });

  return await at.toJwt();
}
