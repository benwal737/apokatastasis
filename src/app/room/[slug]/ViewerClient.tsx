// app/room/[slug]/ViewerClient.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { connectViewer } from "@/lib/connect-service";

type VideoElementProps = {
  track: MediaStreamTrack;
};

const VideoElement = ({ track }: VideoElementProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const stream = new MediaStream([track]);
    videoEl.srcObject = stream;

    return () => {
      videoEl.srcObject = null;
      track.stop();
    };
  }, [track]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      style={{
        width: "100%",
        borderRadius: "8px",
        marginBottom: "8px",
      }}
    />
  );
};

export default function ViewerClient({
  token,
  roomName,
}: {
  token: string;
  roomName: string;
}) {
  const [videoTracks, setVideoTracks] = useState<Map<string, MediaStreamTrack>>(
    new Map()
  );
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const tracks = new Map<string, MediaStreamTrack>();

    const handleTrackSubscribed = (
      track: MediaStreamTrack,
      publication: any,
      participant: any
    ) => {
      if (track.kind === "video") {
        const trackId = track.id;
        tracks.set(trackId, track);
        setVideoTracks(new Map(tracks));
      }
    };

    const handleTrackUnsubscribed = (
      track: MediaStreamTrack,
      publication: any,
      participant: any
    ) => {
      if (track.kind === "video") {
        tracks.delete(track.id);
        setVideoTracks(new Map(tracks));
        track.stop();
      }
    };

    (async () => {
      try {
        const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_WS_URL!;
        if (!wsUrl) {
          throw new Error("WebSocket URL is not configured");
        }

        const { disconnect } = await connectViewer({
          wsUrl,
          token,
          onTrackSubscribed: handleTrackSubscribed,
          onTrackUnsubscribed: handleTrackUnsubscribed,
        });

        cleanup = () => {
          disconnect();
          tracks.forEach((track) => track.stop());
        };

        setConnectionStatus("connected");
      } catch (e: any) {
        console.error("Connection error:", e);
        setError(e?.message ?? "Failed to connect to the stream");
        setConnectionStatus("error");
      }
    })();

    return () => {
      cleanup?.();
      tracks.forEach((track) => track.stop());
    };
  }, [token]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="mb-4 text-sm text-muted-foreground">
        Room: <span className="font-medium">{roomName}</span> • Status:{" "}
        <span className="font-medium">
          {connectionStatus === "connecting" && "Connecting..."}
          {connectionStatus === "connected" &&
            `Streaming (${videoTracks.size} tracks)`}
          {connectionStatus === "error" && "Connection error"}
        </span>
        {error && (
          <div className="mt-2 p-2 bg-red-50 text-red-700 rounded text-sm">
            {error}
          </div>
        )}
      </div>

      <div
        className="bg-black rounded-lg overflow-hidden aspect-video w-full flex items-center justify-center"
        ref={containerRef}
      >
        {Array.from(videoTracks.entries()).map(([trackId, track]) => (
          <VideoElement key={trackId} track={track} />
        ))}
        {connectionStatus === "connecting" && (
          <div className="text-white">Connecting to stream...</div>
        )}
        {connectionStatus === "error" && (
          <div className="text-white">Failed to connect to the stream</div>
        )}
        {connectionStatus === "connected" && videoTracks.size === 0 && (
          <div className="text-white">Waiting for stream to start...</div>
        )}
      </div>
    </div>
  );
}
