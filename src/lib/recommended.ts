import { getRooms } from "../app/(browse)/actions";
import { getSelf } from "./auth";

export async function getRecommendedRooms() {
  const self = await getSelf();

  const rooms = await getRooms();
  const recommendedRooms = self
    ? rooms.filter((room) => room.host.id !== self.id)
    : rooms;
  return recommendedRooms.slice(0, 5);
}
