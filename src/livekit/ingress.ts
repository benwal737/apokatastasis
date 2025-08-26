"use server";

import {
  IngressAudioEncodingPreset,
  IngressVideoEncodingPreset,
  IngressInput,
  IngressClient,
  RoomServiceClient,
  TrackSource,
  CreateIngressOptions,
  IngressVideoEncodingOptions,
  IngressVideoOptions,
} from "livekit-server-sdk";
import prisma from "@/lib/prisma";
import { getSelf } from "@/lib/auth-service";
import { Room } from "@prisma/client";

const roomService = new RoomServiceClient(
  process.env.LIVEKIT_API_URL!,
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

const ingressClient = new IngressClient(process.env.LIVEKIT_API_URL!);

export const resetIngresses = async (hostId: string) => {
  const ingresses = await ingressClient.listIngress({
    roomName: hostId,
  });

  const rooms = await roomService.listRooms([hostId]);

  for (const room of rooms) {
    await roomService.deleteRoom(room.name);
  }

  for (const ingress of ingresses) {
    if (ingress.ingressId) {
      await ingressClient.deleteIngress(ingress.ingressId);
    }
  }
};

export const createIngress = async (
  ingressType: IngressInput,
  roomId: string
) => {
  const self = await getSelf();
  if (!self) {
    throw new Error("Unauthorized");
  }

  await resetIngresses(self.id);

  const options: CreateIngressOptions = {
    name: self.username,
    roomName: self.id,
    participantName: self.username,
    participantIdentity: self.id,
  };

  if (ingressType === IngressInput.WHIP_INPUT) {
    options.enableTranscoding = false;
  } else {
    options.video = new IngressVideoOptions({
      source: TrackSource.CAMERA,
      encodingOptions: {
        case: "preset",
        value: IngressVideoEncodingPreset.H264_1080P_30FPS_3_LAYERS,
      },
    });
  }

  const ingress = await ingressClient.createIngress(ingressType, options);

  if (!ingress || !ingress.url || !ingress.streamKey) {
    throw new Error("Failed to create ingress");
  }

  await prisma.pov.create({
    data: {
      roomId,
      label: self.username,
      userId: self.id,
      ingressId: ingress.ingressId,
      serverUrl: ingress.url,
      streamKey: ingress.streamKey,
    },
  });

  return ingress;
};
