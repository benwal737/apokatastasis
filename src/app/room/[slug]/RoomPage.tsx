"use client";
import { useState } from "react";
import { Room, Pov } from "@prisma/client";
import { Button } from "@/components/ui/button";
import PublisherDialog from "./PublisherDialog";
import ActiveViewer from "./ActiveViewer";
import { createBrowserPov } from "@/livekit/createBrowserPov";

export default function RoomPage({
  room,
  viewerToken,
  wsUrl,
}: {
  room: Room & { povs: Pov[] };
  viewerToken: string;
  wsUrl: string;
}) {
  const [pubOpen, setPubOpen] = useState(false);
  const [pubToken, setPubToken] = useState("");

  const goLive = async () => {
    try {
      const { token } = await createBrowserPov(room.id);
      setPubToken(token);
      setPubOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{room.name}</h1>
          <p className="text-muted-foreground">{room.joinCode}</p>
        </div>
        <Button onClick={goLive}>Go Live (Browser)</Button>
      </header>

      <ActiveViewer wsUrl={wsUrl} token={viewerToken} />

      <PublisherDialog
        wsUrl={wsUrl}
        token={pubToken}
        open={pubOpen}
        onOpenChange={setPubOpen}
      />
    </div>
  );
}
