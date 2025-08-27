// app/room/[slug]/ViewerClient.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { connectViewer } from "@/lib/connect-service";

export default function ViewerClient({
  token,
  roomName,
}: {
  token: string;
  roomName: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        if (!containerRef.current) return;
        const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_WS_URL!;
        const { disconnect } = await connectViewer({
          wsUrl,
          token,
          container: containerRef.current,
        });
        cleanup = disconnect;
        setConnected(true);
      } catch (e: any) {
        setError(e?.message ?? "Failed to connect");
      }
    })();

    return () => cleanup?.();
  }, [token]);

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        Viewer: {connected ? "connected" : "connecting…"} (room: {roomName})
        {error ? <span className="text-red-600"> — {error}</span> : null}
      </div>

      {/* Videos/audio will be appended here */}
      <div
        ref={containerRef}
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr"
      />
    </div>
  );
}
