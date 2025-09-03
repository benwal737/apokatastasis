import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);
    const eventType = evt.type;

    if (eventType === "user.created") {
      await prisma.user.create({
        data: {
          username: evt.data.username!,
          imageUrl: evt.data.image_url!,
          externalUserId: evt.data.id!,
        },
      });
      return new Response("User created", { status: 200 });
    }

    if (eventType === "user.updated") {
      const user = await prisma.user.findUnique({
        where: {
          externalUserId: evt.data.id!,
        },
      });

      if (user) {
        await prisma.user.update({
          where: {
            externalUserId: evt.data.id!,
          },
          data: {
            username: evt.data.username || "",
            imageUrl: evt.data.image_url || "",
          },
        });
      }
      return new Response("User updated", { status: 200 });
    }

    if (eventType === "user.deleted") {
      const user = await prisma.user.findUnique({
        where: {
          externalUserId: evt.data.id!,
        },
      });

      if (user) {
        await prisma.user.delete({
          where: {
            externalUserId: evt.data.id!,
          },
        });
      }
      return new Response("User deleted", { status: 200 });
    }

    return new Response("Event type not handled", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Webhook error", { status: 400 });
  }
}
