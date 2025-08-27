import { getRoom } from "../actions";
import RoomPage from "./RoomPage";
import { redirect } from "next/navigation";
import { getViewerToken } from "@/lib/token-service";

const page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const room = await getRoom((await params).slug);
  const token = await getViewerToken({ roomName: room!.id });
  if (!room) {
    redirect("/");
  }
  return <RoomPage room={room} token={token} />;
};

export default page;
