import { getRoom } from "../actions";
import RoomPage from "./RoomPage";
import { redirect } from "next/navigation";
import { getRoomToken } from "@/livekit/token";
import { getSelf } from "@/lib/auth";

const page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const self = await getSelf();
  try {
    const room = await getRoom((await params).slug);
    
    // If room doesn't exist (null), redirect to homepage
    if (!room) {
      redirect("/");
    }

    // Generate unique identity for each participant
    const participantIdentity = self?.id || `guest-${Math.random().toString(36).substring(2, 15)}`;
    console.log("Participant connecting with identity:", participantIdentity, "Name:", self?.username || "Guest");
    
    const token = await getRoomToken({
      roomName: room.id,
      identity: participantIdentity,
      name: self?.username || "Guest",
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
        username={self?.username || null}
      />
    );
  } catch (error) {
    console.error("Room error:", error);
    redirect("/");
  }
};

export default page;
