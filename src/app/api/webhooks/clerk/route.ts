import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);
    const eventType = evt.type;

    if (eventType === "user.created") {
      console.log("User created:", evt.data.id);
      await prisma.user.create({
        data: {
          username: evt.data.username!,
          imageUrl: evt.data.image_url!,
          externalUserId: evt.data.id!,
        },
      });
    } else if (eventType === "user.updated") {
      console.log("User updated:", evt.data.id);
      const user = await prisma.user.findUnique({
        where: {
          externalUserId: evt.data.id!,
        },
      });
      if (!user) {
        return;
      }
      await prisma.user.update({
        where: {
          externalUserId: evt.data.id!,
        },
        data: {
          username: evt.data.username || "",
          imageUrl: evt.data.image_url || "",
        },
      });
    } else if (eventType === "user.deleted") {
      console.log("User deleted:", evt.data.id);
      const user = await prisma.user.findUnique({
        where: {
          externalUserId: evt.data.id!,
        },
      });
      if (!user) {
        return;
      }
      await prisma.user.delete({
        where: {
          externalUserId: evt.data.id!,
        },
      });
    } else {
      console.log("Unknown event type:", eventType);
    }

    return new Response("Webhook received", { status: 200 });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", { status: 400 });
  }
}
