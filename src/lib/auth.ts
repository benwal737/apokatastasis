import { currentUser } from "@clerk/nextjs/server";
import prisma from "./prisma";

export const getSelf = async () => {
  const self = await currentUser();
  if (!self || !self.username) {
    return null;
  }
  const user = prisma.user.findUnique({
    where: {
      externalUserId: self.id,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};
