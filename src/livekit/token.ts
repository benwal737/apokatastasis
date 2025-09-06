"use server";

import { AccessToken } from "livekit-server-sdk";

export async function getRoomToken({
  roomName,
  identity,
  name,
  role,
}: {
  roomName: string;
  identity: string;
  name?: string;
  role: string;
}) {
  const apiKey = process.env.LIVEKIT_API_KEY!;
  const apiSecret = process.env.LIVEKIT_API_SECRET!;
  const at = new AccessToken(apiKey, apiSecret, { identity, name });

  if (role === "viewer") {
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canSubscribe: true,
      canPublish: false,
      canPublishData: false, // Viewers can't publish data
    });
  } else {
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canSubscribe: true,
      canPublish: true,
      canPublishData: true, // Publishers can send data messages
    });
  }

  return at.toJwt();
}
