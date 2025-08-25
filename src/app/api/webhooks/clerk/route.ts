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
          username:
            evt.data.username ||
            evt.data.email_addresses[0].email_address.split("@")[0],
          imageUrl: evt.data.image_url!,
          externalUserId: evt.data.id!,
        },
      });
    }

    return new Response("Webhook received", { status: 200 });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", { status: 400 });
  }
}
