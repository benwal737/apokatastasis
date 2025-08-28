import { getRoom } from "../actions";
import RoomPage from "./RoomPage";
import { redirect } from "next/navigation";
import { getRoomToken } from "@/livekit/token";

const page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const room = await getRoom((await params).slug);
  const token = await getRoomToken({
    roomName: room!.id,
    identity: room!.hostId,
    role: "viewer",
  });
  if (!room) {
    redirect("/");
  }
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_WS_URL;
  if (!wsUrl) {
    throw new Error("Missing NEXT_PUBLIC_LIVEKIT_WS_URL");
  }
  return <RoomPage room={room} viewerToken={token} wsUrl={wsUrl} />;
};

export default page;
