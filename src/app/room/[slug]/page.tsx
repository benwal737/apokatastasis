import { getRoom } from "../actions";
import RoomPage from "./RoomPage";
import { redirect } from "next/navigation";

const page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const room = await getRoom((await params).slug);
  if (!room) {
    redirect("/");
  }
  return <RoomPage room={room} />;
};

export default page;
