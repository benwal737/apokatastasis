"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  RoomEvent,
  RemoteTrackPublication,
  RemoteTrack,
  RemoteParticipant,
  LocalTrackPublication,
  Track,
  LocalParticipant,
} from "livekit-client";
import { useRoom } from "@/context/RoomContext";
import VideoTile from "./VideoTile";
import { Tile } from "./VideoTile";

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

export default function ViewPanel({
  onManage,
}: {
  onManage?: (povId: string) => void;
}) {
  const router = useRouter();
  const { room } = useRoom();
  const [tiles, setTiles] = useState<Tile[]>([]);

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
        participant,
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
        participant: room.localParticipant,
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
      participant: RemoteParticipant | LocalParticipant
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

  // Handle room deletion events
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        console.log("ViewPanel received data:", data);
        
        if (data.type === "room-deleted") {
          console.log("Room deleted event received in ViewPanel");
          toast.error("This room has been deleted by the host.");
          router.push("/");
        }
      } catch (err) {
        console.error("Failed to parse data message", err);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, router]);

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
          isMine={t.isLocal === true}
          onManage={onManage}
        />
      ))}
    </div>
  );
}
