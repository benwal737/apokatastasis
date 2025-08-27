import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSelf } from "@/lib/auth-service";

async function assertAccess(povId: string, userId: string) {
  const pov = await prisma.pov.findUnique({ where: { id: povId } });
  if (!pov) throw new Error("POV not found");
  if (pov.userId !== userId) throw new Error("Forbidden");
  return pov;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { povId: string } }
) {
  try {
    const self = await getSelf();
    if (!self)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const pov = await assertAccess(params.povId, self.id);

    if (!pov.serverUrl || !pov.streamKey) {
      return NextResponse.json(
        { error: "POV missing serverUrl/streamKey" },
        { status: 400 }
      );
    }

    const sdpOffer = await req.text();

    const upstream = await fetch(pov.serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/sdp",
        Authorization: `Bearer ${pov.streamKey}`,
      },
      body: sdpOffer,
    });

    const sdpAnswer = await upstream.text();

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "WHIP upstream error", details: sdpAnswer },
        { status: upstream.status }
      );
    }

    const resourceUrl = upstream.headers.get("Location") ?? null;

    if (resourceUrl && resourceUrl !== pov.whipResourceUrl) {
      await prisma.pov.update({
        where: { id: pov.id },
        data: { whipResourceUrl: resourceUrl },
      });
    }

    return new NextResponse(sdpAnswer, {
      status: 201,
      headers: { "Content-Type": "application/sdp" },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Internal Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { povId: string } }
) {
  try {
    const self = await getSelf();
    if (!self)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const pov = await assertAccess(params.povId, self.id);

    if (!pov.whipResourceUrl || !pov.streamKey) {
      return NextResponse.json(
        { error: "POV missing whipResourceUrl/streamKey" },
        { status: 400 }
      );
    }

    const upstream = await fetch(pov.whipResourceUrl, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${pov.streamKey}` },
    });

    if (!upstream.ok && upstream.status !== 404) {
      const text = await upstream.text();
      return NextResponse.json(
        { error: "WHIP delete failed", details: text },
        { status: upstream.status }
      );
    }

    await prisma.pov.update({
      where: { id: pov.id },
      data: { whipResourceUrl: null },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Internal Error" },
      { status: 500 }
    );
  }
}
