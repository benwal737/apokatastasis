"use server";

import {
  IngressAudioEncodingPreset,
  IngressVideoEncodingPreset,
  IngressInput,
  IngressClient,
  RoomServiceClient,
  TrackSource,
  CreateIngressOptions,
  IngressVideoOptions,
  IngressAudioOptions,
} from "livekit-server-sdk";
import prisma from "@/lib/prisma";
import { getSelf } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const roomService = new RoomServiceClient(
  process.env.LIVEKIT_API_URL!,
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

const ingressClient = new IngressClient(process.env.LIVEKIT_API_URL!);

async function deleteExistingIngressForPov(ingressId?: string | null) {
  if (!ingressId) return;
  try {
    await ingressClient.deleteIngress(ingressId);
  } catch (e) {
    console.warn("deleteExistingIngressForPov failed", e);
  }
}

export const createIngress = async (
  ingressType: IngressInput,
  roomId: string,
  label: string
) => {
  const self = await getSelf();
  if (!self) throw new Error("Unauthorized");

  const pov = await prisma.pov.create({
    data: {
      roomId,
      label,
      username: self.username,
      userId: self.id,
    },
    select: { id: true, ingressId: true },
  });

  await deleteExistingIngressForPov(pov.ingressId);

  const options: CreateIngressOptions = {
    name: label,
    roomName: roomId,
    participantName: label,
    participantIdentity: pov.id,
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
    options.audio = new IngressAudioOptions({
      source: TrackSource.MICROPHONE,
      encodingOptions: {
        case: "preset",
        value: IngressAudioEncodingPreset.OPUS_STEREO_96KBPS,
      },
    });
  }

  const ingress = await ingressClient.createIngress(ingressType, options);

  if (!ingress || !ingress.url) {
    throw new Error("Failed to create ingress (missing url)");
  }
  const needsStreamKey = ingressType !== IngressInput.WHIP_INPUT;
  if (needsStreamKey && !ingress.streamKey) {
    throw new Error("Failed to create RTMP ingress (missing stream key)");
  }

  await prisma.pov.update({
    where: { id: pov.id },
    data: {
      ingressId: ingress.ingressId ?? null,
      serverUrl: ingress.url ?? null,
      streamKey: ingress.streamKey ?? null,
    },
  });

  revalidatePath(`/room/${roomId}`);

  return {
    povId: pov.id,
    ingressId: ingress.ingressId,
    url: ingress.url,
    streamKey: ingress.streamKey,
  };
};
