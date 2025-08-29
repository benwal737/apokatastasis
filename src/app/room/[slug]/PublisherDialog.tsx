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
  title = "Go Live (Browser)",
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

  // when dialog opens, start publishing
  useEffect(() => {
    if (!open || !room) return;
    if (startedRef.current) return;

    let mounted = true;
    (async () => {
      setConnecting(true);
      setStatus(null);
      try {
        try {
          await room.localParticipant.setCameraEnabled(true);
          await room.localParticipant.setMicrophoneEnabled(true);
          await room.localParticipant.setMetadata(
            JSON.stringify({
              povLabel: label,
            })
          );
        } catch (err) {
          if (token) {
            await room.connect(wsUrl, token);
            await room.localParticipant.setCameraEnabled(true);
            await room.localParticipant.setMicrophoneEnabled(true);
            await room.localParticipant.setMetadata(
              JSON.stringify({
                povLabel: label,
              })
            );
          } else {
            throw err;
          }
        }

        const camPub = room.localParticipant.getTrackPublication(
          Track.Source.Camera
        );
        if (camPub?.track && videoRef.current) {
          camPub.track.attach(videoRef.current);
        }

        const micPub = room.localParticipant.getTrackPublication(
          Track.Source.Microphone
        );
        if (micPub?.track && audioRef.current) {
          micPub.track.attach(audioRef.current);
        }

        const sync = () => {
          const v = room.localParticipant.getTrackPublication(
            Track.Source.Camera
          );
          const a = room.localParticipant.getTrackPublication(
            Track.Source.Microphone
          );
          setCamOn(!!(v && !v.isMuted));
          setMicOn(!!(a && !a.isMuted));
        };

        const handleLocalPublished = (pub: LocalTrackPublication) => {
          if (pub.kind === Track.Kind.Video && pub.track && videoRef.current) {
            pub.track.attach(videoRef.current);
          }
          if (pub.kind === Track.Kind.Audio && pub.track && audioRef.current) {
            pub.track.attach(audioRef.current);
          }
          sync();
        };

        room.on(RoomEvent.LocalTrackPublished, handleLocalPublished);
        room.on(RoomEvent.TrackMuted, sync);
        room.on(RoomEvent.TrackUnmuted, sync);

        room.on(RoomEvent.Reconnecting, () => setStatus("Reconnecting…"));
        room.on(RoomEvent.Reconnected, () => setStatus(null));
        room.on(RoomEvent.Disconnected, (reason) =>
          setStatus(`Disconnected: ${reason}`)
        );

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

  // when dialog reopens, reattach video/audio elements
  useEffect(() => {
    if (!open || !room) return;

    const timer = setTimeout(() => {
      const camPub = room.localParticipant.getTrackPublication(
        Track.Source.Camera
      );
      const micPub = room.localParticipant.getTrackPublication(
        Track.Source.Microphone
      );
      if (camPub?.track && videoRef.current) {
        camPub.track.attach(videoRef.current);
      }
      if (micPub?.track && audioRef.current) {
        micPub.track.attach(audioRef.current);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [open, room]);

  // stop & close
  const stopAndClose = async () => {
    const r = roomRef.current;
    if (!r) return;
    try {
      const pubs = Array.from(r.localParticipant.trackPublications.values());
      await Promise.all(
        pubs.map(async (pub) => {
          if (pub.track) {
            try {
              await r.localParticipant.unpublishTrack(pub.track);
            } catch {}
            try {
              pub.track.stop();
            } catch {}
          }
        })
      );
    } catch (e) {
      console.error("stop publishing error", e);
    }
    startedRef.current = false;
    onStopped?.();
    onOpenChange(false);
  };

  // cleanup on unmount if requested
  useEffect(() => {
    return () => {
      if (!stopOnUnmount) return;
      const r = roomRef.current;
      if (!r || !startedRef.current) return;
      const pubs = Array.from(r.localParticipant.trackPublications.values());
      pubs.forEach((pub) => {
        if (pub.track) {
          try {
            r.localParticipant.unpublishTrack(pub.track);
          } catch {}
          try {
            pub.track.stop();
          } catch {}
        }
      });
      startedRef.current = false;
    };
  }, [stopOnUnmount]);

  const toggleCamera = async () => {
    try {
      await room?.localParticipant.setCameraEnabled(!camOn);
      setCamOn((v) => !v);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleMic = async () => {
    try {
      await room?.localParticipant.setMicrophoneEnabled(!micOn);
      setMicOn((v) => !v);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenChange = (v: boolean) => {
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden p-0">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {status && (
          <div className="mx-5 mt-2 rounded-md bg-red-50 p-2 text-sm text-red-700">
            {status}
          </div>
        )}

        <div className="px-5 pb-4">
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              autoPlay
              playsInline
              muted={false}
            />
            <audio ref={audioRef} autoPlay className="hidden" />
          </div>
        </div>

        <Separator />

        <DialogFooter className="flex w-full items-center gap-2 px-5 pb-4 pt-3">
          <div className="flex items-center gap-2">
            <Button
              variant={camOn ? "default" : "secondary"}
              onClick={toggleCamera}
            >
              {camOn ? "Turn Camera Off" : "Turn Camera On"}
            </Button>
            <Button
              variant={micOn ? "default" : "secondary"}
              onClick={toggleMic}
            >
              {micOn ? "Mute Mic" : "Unmute Mic"}
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="destructive" onClick={stopAndClose}>
              Stop & Close
            </Button>
          </div>
        </DialogFooter>

        {connecting && (
          <p className="px-5 pb-4 text-xs text-muted-foreground">Connecting…</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
