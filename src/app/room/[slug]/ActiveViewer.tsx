"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  RoomEvent,
  RemoteTrackPublication,
  RemoteTrack,
  RemoteParticipant,
  LocalTrackPublication,
  Track,
} from "livekit-client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRoom } from "@/context/RoomContext";

type PovInfo = { id: string; label: string };

type Tile = {
  pubSid: string;
  participantIdentity: string;
  label: string;
  attach: (el: HTMLMediaElement) => void;
  detach: (el: HTMLMediaElement) => void;
  source?: Track.Source;
  isLocal?: boolean;
};

function getParticipantLabel(
  participant: RemoteParticipant | { identity: string; metadata?: string }
): string {
  try {
    if (participant.metadata) {
      const metadata = JSON.parse(participant.metadata);
      if (metadata.povLabel) {
        return metadata.povLabel;
      }
    }
  } catch (e) {
    console.error("Error parsing participant metadata:", e);
  }

  return "POV";
}

export default function ActiveViewer({
  povs,
  myPovId,
  onManage,
}: {
  povs: PovInfo[];
  myPovId?: string;
  onManage?: (povId: string) => void;
}) {
  const { room } = useRoom();
  const [tiles, setTiles] = useState<Tile[]>([]);

  const labelByIdentity = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of povs) m.set(p.id, p.label);
    return m;
  }, [povs]);

  const upsertTile = useCallback((nextTile: Tile) => {
    setTiles((prev) => {
      const filtered = prev.filter((t) => t.pubSid !== nextTile.pubSid);
      return [...filtered, nextTile];
    });
  }, []);

  const removeByPubSid = useCallback((pubSid: string) => {
    setTiles((prev) => prev.filter((t) => t.pubSid !== pubSid));
  }, []);

  const addRemotePublication = useCallback(
    (pub: RemoteTrackPublication, participant: RemoteParticipant) => {
      if (!pub.track) return;
      if (pub.kind !== Track.Kind.Video) return;

      const rtrack = pub.track as RemoteTrack;
      const label = getParticipantLabel(participant);

      upsertTile({
        pubSid: pub.trackSid,
        participantIdentity: participant.identity,
        label,
        attach: (el) => rtrack.attach(el),
        detach: (el) => rtrack.detach(el),
        source: pub.source,
        isLocal: false,
      });
    },
    [upsertTile]
  );

  const addLocalPublication = useCallback(
    (pub: LocalTrackPublication) => {
      if (!room) return;
      if (!pub.track) return;
      if (pub.kind !== Track.Kind.Video) return;

      const ltrack = pub.track;
      const label = getParticipantLabel(room.localParticipant);

      upsertTile({
        pubSid: pub.trackSid,
        participantIdentity: room.localParticipant.identity,
        label,
        attach: (el) => {
          try {
            ltrack.attach(el);
          } catch (e) {
            console.error("Error attaching local track:", e);
          }
        },
        detach: (el) => {
          try {
            ltrack.detach(el);
          } catch (e) {
            console.error("Error detaching local track:", e);
          }
        },
        source: pub.source,
        isLocal: true,
      });
    },
    [room, upsertTile]
  );

  // update tile labels when participant metadata changes!!!!!!!
  useEffect(() => {
    if (!room) return;

    const handleMetadataChanged = (
      metadata: string | undefined,
      participant: any
    ) => {
      setTiles((prev) =>
        prev.map((tile) => {
          if (tile.participantIdentity === participant.identity) {
            const label = getParticipantLabel(participant);
            return { ...tile, label };
          }
          return tile;
        })
      );
    };

    room.on(RoomEvent.ParticipantMetadataChanged, handleMetadataChanged);

    return () => {
      room.off(RoomEvent.ParticipantMetadataChanged, handleMetadataChanged);
    };
  }, [room]);

  useEffect(() => {
    if (!room) return;
    const handleTrackSubscribed = (
      _track: RemoteTrack,
      pub: RemoteTrackPublication,
      participant: RemoteParticipant
    ) => addRemotePublication(pub, participant);

    const handleTrackUnsubscribed = (
      _track: RemoteTrack,
      pub: RemoteTrackPublication
    ) => removeByPubSid(pub.trackSid);

    const handleLocalPublished = (pub: LocalTrackPublication) => {
      if (pub.track && pub.track.kind === Track.Kind.Video)
        addLocalPublication(pub);
    };

    const handleLocalUnpublished = (pub: LocalTrackPublication) => {
      removeByPubSid(pub.trackSid);
    };

    room
      .on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
      .on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
      .on(RoomEvent.LocalTrackPublished, handleLocalPublished)
      .on(RoomEvent.LocalTrackUnpublished, handleLocalUnpublished);

    room.remoteParticipants.forEach((p) => {
      p.trackPublications.forEach((pub) => {
        if (pub.isSubscribed && pub.track && pub.kind === Track.Kind.Video) {
          addRemotePublication(pub, p);
        }
      });
    });

    Array.from(room.localParticipant.trackPublications.values()).forEach(
      (pub) => {
        if (pub.track && pub.kind === Track.Kind.Video) {
          addLocalPublication(pub as LocalTrackPublication);
        }
      }
    );

    return () => {
      room
        .off(RoomEvent.TrackSubscribed, handleTrackSubscribed)
        .off(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
        .off(RoomEvent.LocalTrackPublished, handleLocalPublished)
        .off(RoomEvent.LocalTrackUnpublished, handleLocalUnpublished);
    };
  }, [room, addRemotePublication, addLocalPublication, removeByPubSid]);

  if (tiles.length === 0) {
    return (
      <div className="h-[60vh] grid place-items-center text-muted-foreground">
        No active streams yet
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
      {tiles.map((t) => (
        <VideoTile
          key={t.pubSid}
          tile={t}
          label={t.label}
          isMine={t.isLocal === true}
          onManage={onManage}
        />
      ))}
    </div>
  );
}

function VideoTile({
  tile,
  label,
  isMine,
  onManage,
}: {
  tile: Tile;
  label: string;
  isMine: boolean;
  onManage?: (povId: string) => void;
}) {
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
    <Card className="relative overflow-hidden">
      <CardHeader className="py-2">
        <CardTitle className="text-sm">
          {label}
          <span className="text-muted-foreground">
            {tile.isLocal ? " (You)" : ""}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <video
          ref={ref}
          autoPlay
          playsInline
          muted={tile.isLocal === true}
          className="aspect-video w-full object-cover"
        />
      </CardContent>

      {isMine && onManage && (
        <div className="absolute bottom-2 right-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onManage?.(tile.participantIdentity)}
          >
            Manage
          </Button>
        </div>
      )}
    </Card>
  );
}
