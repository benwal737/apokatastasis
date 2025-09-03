"use client";

import { useEffect, useRef, useState } from "react";
import { RoomEvent, Track, LocalTrackPublication } from "livekit-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useRoom } from "@/context/RoomContext";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  wsUrl: string;
  token: string;
  title?: string;
  onStarted?: () => void;
  onStopped?: () => void;
  stopOnUnmount?: boolean;
  label: string;
};

export default function PublisherDialog({
  open,
  onOpenChange,
  wsUrl,
  token,
  title = "You're live!",
  onStarted,
  onStopped,
  stopOnUnmount = false,
  label,
}: Props) {
  const { room } = useRoom();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedRef = useRef(false);
  const roomRef = useRef(room);
  roomRef.current = room;

  const [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [camOn, setCamOn] = useState(false);
  const [micOn, setMicOn] = useState(false);

  // --- start publishing when dialog opens
  useEffect(() => {
    if (!open || !room) return;
    if (startedRef.current) return;

    let mounted = true;
    (async () => {
      setConnecting(true);
      setStatus(null);

      try {
        if (token) {
          await room.connect(wsUrl, token);
        }

        room.once(RoomEvent.Connected, async () => {
          try {
            await room.localParticipant.setMetadata(
              JSON.stringify({ povLabel: label })
            );
          } catch (err) {
            console.error("metadata update failed", err);
          }
        });

        await room.localParticipant.setCameraEnabled(true);
        await room.localParticipant.setMicrophoneEnabled(true);

        const syncState = () => {
          const camPub = room.localParticipant.getTrackPublication(
            Track.Source.Camera
          );
          const micPub = room.localParticipant.getTrackPublication(
            Track.Source.Microphone
          );
          setCamOn(!!(camPub && !camPub.isMuted));
          setMicOn(!!(micPub && !micPub.isMuted));
        };

        // initial attach
        const camPub = room.localParticipant.getTrackPublication(
          Track.Source.Camera
        );
        if (camPub?.track && videoRef.current)
          camPub.track.attach(videoRef.current);

        const micPub = room.localParticipant.getTrackPublication(
          Track.Source.Microphone
        );
        if (micPub?.track && audioRef.current)
          micPub.track.attach(audioRef.current);

        // event handlers
        const handleLocalPublished = (pub: LocalTrackPublication) => {
          if (pub.kind === Track.Kind.Video && pub.track && videoRef.current) {
            pub.track.attach(videoRef.current);
          }
          if (pub.kind === Track.Kind.Audio && pub.track && audioRef.current) {
            pub.track.attach(audioRef.current);
          }
          syncState();
        };

        room.on(RoomEvent.LocalTrackPublished, handleLocalPublished);
        room.on(RoomEvent.LocalTrackUnpublished, syncState);
        room.on(RoomEvent.TrackMuted, syncState);
        room.on(RoomEvent.TrackUnmuted, syncState);

        room.on(RoomEvent.Reconnecting, () => setStatus("Reconnecting…"));
        room.on(RoomEvent.Reconnected, () => setStatus(null));
        room.on(RoomEvent.Disconnected, (reason) =>
          setStatus(`Disconnected: ${reason}`)
        );

        syncState();
        startedRef.current = true;
        onStarted?.();
      } catch (e: any) {
        console.error("publisher start failed:", e);
        setStatus(e?.message ?? "Failed to publish");
        onOpenChange(false);
      } finally {
        if (mounted) setConnecting(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, room, token, wsUrl, label]);

  // reattach video/audio when reopening
  useEffect(() => {
    if (!open || !room) return;
    const timer = setTimeout(() => {
      const camPub = room.localParticipant.getTrackPublication(
        Track.Source.Camera
      );
      if (camPub?.track && videoRef.current)
        camPub.track.attach(videoRef.current);

      const micPub = room.localParticipant.getTrackPublication(
        Track.Source.Microphone
      );
      if (micPub?.track && audioRef.current)
        micPub.track.attach(audioRef.current);
    }, 100);
    return () => clearTimeout(timer);
  }, [open, room]);

  // stop publishing
  const stopAndClose = async () => {
    const r = roomRef.current;
    if (!r) return;
    try {
      for (const pub of r.localParticipant.trackPublications.values()) {
        if (pub.track) {
          pub.track.stop();
          await r.localParticipant.unpublishTrack(pub.track);
        }
      }
    } catch (e) {
      console.error("stop publishing error", e);
    }
    startedRef.current = false;
    onStopped?.();
    onOpenChange(false);
  };

  // cleanup
  useEffect(() => {
    return () => {
      if (!stopOnUnmount) return;
      const r = roomRef.current;
      if (!r || !startedRef.current) return;
      for (const pub of r.localParticipant.trackPublications.values()) {
        if (pub.track) {
          r.localParticipant.unpublishTrack(pub.track);
          pub.track.stop();
        }
      }
      startedRef.current = false;
    };
  }, [stopOnUnmount]);

  const toggleCamera = async () => {
    try {
      await room?.localParticipant.setCameraEnabled(!camOn);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleMic = async () => {
    try {
      await room?.localParticipant.setMicrophoneEnabled(!micOn);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[600px] overflow-hidden p-0">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* {status && (
          <div className="mx-5 mt-2 rounded-md bg-red-50 p-2 text-sm text-red-700">
            {status}
          </div>
        )} */}

        <div className="relative aspect-video w-full p-5">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
          <audio ref={audioRef} autoPlay playsInline className="hidden" />
        </div>

        <DialogFooter className="flex gap-2 px-5 py-3">
          <Button
            variant={camOn ? "default" : "secondary"}
            onClick={toggleCamera}
          >
            {camOn ? "Turn Camera Off" : "Turn Camera On"}
          </Button>
          <Button variant={micOn ? "default" : "secondary"} onClick={toggleMic}>
            {micOn ? "Mute Mic" : "Unmute Mic"}
          </Button>
          <Separator
            orientation="vertical"
            className="hidden md:block mx-2 h-6"
          />
          <Button variant="destructive" onClick={stopAndClose}>
            Stop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
