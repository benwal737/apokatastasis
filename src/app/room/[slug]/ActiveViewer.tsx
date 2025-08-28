// ActiveViewer.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Room,
  RoomEvent,
  RemoteTrack,
  RemoteTrackPublication,
  Track,
  RemoteParticipant,
} from "livekit-client";

type RemoteTile = {
  id: string; // pub.trackSid
  kind: "video" | "audio";
  participantIdentity: string;
  attach: (el: HTMLMediaElement) => void;
  detach: (el: HTMLMediaElement) => void;
};

export default function ActiveViewer({
  wsUrl,
  token, // "viewer"
}: {
  wsUrl: string;
  token: string;
}) {
  const [room] = useState(
    () => new Room({ adaptiveStream: true, dynacast: true })
  );
  const [tiles, setTiles] = useState<RemoteTile[]>([]);

  const addPub = (
    pub: RemoteTrackPublication,
    participant: RemoteParticipant
  ) => {
    if (!pub.track) return;
    const isVideo = pub.kind === Track.Kind.Video;
    const trackObj = pub.track as RemoteTrack;
    setTiles((prev) => [
      ...prev.filter((t) => t.id !== pub.trackSid),
      {
        id: pub.trackSid,
        kind: isVideo ? "video" : "audio",
        participantIdentity: participant.identity,
        attach: (el) => trackObj.attach(el),
        detach: (el) => trackObj.detach(el),
      },
    ]);
  };

  const removePub = (pub: RemoteTrackPublication) => {
    setTiles((prev) => prev.filter((t) => t.id !== pub.trackSid));
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      await room.connect(wsUrl, token);

      room
        .on(RoomEvent.TrackSubscribed, (_track, pub, participant) =>
          addPub(pub, participant)
        )
        .on(RoomEvent.TrackUnsubscribed, (_track, pub) => removePub(pub));

      // seed existing
      room.remoteParticipants.forEach((p) => {
        p.trackPublications.forEach((pub) => {
          if (pub.isSubscribed && pub.track) addPub(pub, p);
        });
      });
    })();

    return () => {
      mounted = false;
      try {
        room.disconnect();
      } catch {}
      setTiles([]);
    };
  }, [room, wsUrl, token]);

  const videoTiles = useMemo(
    () => tiles.filter((t) => t.kind === "video"),
    [tiles]
  );

  if (videoTiles.length === 0) {
    return (
      <div className="h-[60vh] grid place-items-center text-muted-foreground">
        No active streams yet
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
      {videoTiles.map((t) => (
        <VideoEl key={t.id} tile={t} />
      ))}
    </div>
  );
}

function VideoEl({ tile }: { tile: RemoteTile }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    tile.attach(el);
    return () => {
      try {
        tile.detach(el);
      } catch {}
    };
  }, [tile]);
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      className="aspect-video w-full rounded-lg bg-black object-cover"
    />
  );
}
