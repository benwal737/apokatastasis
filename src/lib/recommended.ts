import { User } from "@prisma/client";
import { getRooms } from "../app/(browse)/actions";
import { getSelf } from "./auth";

export async function getRecommendedRooms() {
  let self: User | null = null;
  try {
    self = await getSelf();
  } catch (error) {
    return [];
  }

  const rooms = await getRooms();
  const recommendedRooms = self
    ? rooms.filter((room) => room.host.id !== self.id)
    : rooms;
  return recommendedRooms.slice(0, 5);
}
