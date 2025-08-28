"use client";

import {
  Room,
  createLocalTracks,
  LocalTrack,
  RoomEvent,
  Track,
} from "livekit-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useEffect, useRef, useState } from "react";

type PublisherDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  wsUrl: string;

  token: string;

  title?: string;

  onStarted?: () => void;

  onStopped?: () => void;

  stopOnUnmount?: boolean;
};

export default function PublisherDialog({
  open,
  onOpenChange,
  wsUrl,
  token,
  title = "Go Live (Browser)",
  onStarted,
  onStopped,
  stopOnUnmount = true,
}: PublisherDialogProps) {
  const [room] = useState(
    () => new Room({ adaptiveStream: true, dynacast: true })
  );

  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [camOn, setCamOn] = useState(false);
  const [micOn, setMicOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const publishedTracksRef = useRef<LocalTrack[]>([]);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!open || !token) return;
    if (startedRef.current) return;

    let mounted = true;
    (async () => {
      setConnecting(true);
      setError(null);
      try {
        await room.connect(wsUrl, token);

        const tracks = await createLocalTracks({ audio: true, video: true });
        for (const t of tracks) await room.localParticipant.publishTrack(t);
        publishedTracksRef.current = tracks;
        startedRef.current = true;

        const vEl = videoRef.current;
        if (vEl) {
          const ms = new MediaStream();
          const vTrack = tracks.find((t) => t.kind === Track.Kind.Video);
          if (vTrack) ms.addTrack(vTrack.mediaStreamTrack);
          vEl.srcObject = ms;
          vEl.muted = true;
          vEl.autoplay = true;
          vEl.playsInline = true;
          vEl.play().catch(() => {});
        }

        const sync = () => {
          const v = room.localParticipant.getTrackPublication(
            Track.Source.Camera
          );
          const a = room.localParticipant.getTrackPublication(
            Track.Source.Microphone
          );
          setCamOn(!(v?.isMuted ?? true));
          setMicOn(!(a?.isMuted ?? true));
        };
        room.on(RoomEvent.TrackMuted, sync);
        room.on(RoomEvent.TrackUnmuted, sync);
        sync();

        onStarted?.();
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "Failed to publish");
      } finally {
        if (mounted) setConnecting(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, token, wsUrl, room]);

  useEffect(() => {
    return () => {
      if (!stopOnUnmount) return;
      try {
        publishedTracksRef.current.forEach((t: LocalTrack) => {
          try {
            room.localParticipant.unpublishTrack(t);
          } catch {}
          try {
            t.stop();
          } catch {}
        });
        publishedTracksRef.current = [];
      } catch {}
      try {
        room.disconnect();
      } catch {}
      startedRef.current = false;
    };
  }, [room, stopOnUnmount]);

  const toggleCamera = async () => {
    try {
      const pub = room.localParticipant.getTrackPublication(
        Track.Source.Camera
      );
      if (!pub || pub.isMuted) {
        await room.localParticipant.setCameraEnabled(true);
        setCamOn(true);
      } else {
        await room.localParticipant.setCameraEnabled(false);
        setCamOn(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleMic = async () => {
    try {
      const pub = room.localParticipant.getTrackPublication(
        Track.Source.Microphone
      );
      if (!pub || pub.isMuted) {
        await room.localParticipant.setMicrophoneEnabled(true);
        setMicOn(true);
      } else {
        await room.localParticipant.setMicrophoneEnabled(false);
        setMicOn(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const stopAndClose = async () => {
    try {
      publishedTracksRef.current.forEach((t: LocalTrack) => {
        try {
          room.localParticipant.unpublishTrack(t);
        } catch {}
        try {
          t.stop();
        } catch {}
      });
      publishedTracksRef.current = [];
    } catch {}
    try {
      room.disconnect();
    } catch {}
    startedRef.current = false;
    onStopped?.();
    onOpenChange(false);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      onOpenChange(false);
      return;
    }
    onOpenChange(true);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden p-0">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="mx-5 mt-2 rounded-md bg-red-50 p-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="px-5 pb-4">
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
            <video ref={videoRef} className="h-full w-full object-cover" />
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
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Minimize
            </Button>
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
