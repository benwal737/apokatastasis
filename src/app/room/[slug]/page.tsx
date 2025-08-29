import { getRoom } from "../actions";
import RoomPage from "./RoomPage";
import { redirect } from "next/navigation";
import { getRoomToken } from "@/livekit/token";
import { getSelf } from "@/lib/auth";

const page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const self = await getSelf();
  try {
    const room = await getRoom((await params).slug);
    const token = await getRoomToken({
      roomName: room!.id,
      identity: room!.hostId,
      role: "viewer",
    });
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_WS_URL;
    if (!wsUrl) {
      throw new Error("Missing NEXT_PUBLIC_LIVEKIT_WS_URL");
    }
    return (
      <RoomPage
        room={room}
        viewerToken={token}
        wsUrl={wsUrl}
        userId={self?.id || null}
      />
    );
  } catch (error) {
    console.error(error);
    redirect("/");
  }
};

export default page;
