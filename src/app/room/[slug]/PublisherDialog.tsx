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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
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

  const [camOn, setCamOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);

  // --- start publishing when dialog opens
  useEffect(() => {
    if (!open || !room) return;
    if (startedRef.current) return;

    (async () => {
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

        // capture initial camera deviceId
        const camPub = room.localParticipant.getTrackPublication(
          Track.Source.Camera
        );
        const track = camPub?.track?.mediaStreamTrack;
        if (track) {
          const settings = track.getSettings();
          if (settings.deviceId) {
            setCurrentDeviceId(settings.deviceId);
          }
        }

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

        syncState();

        // fetch devices
        const devices = (
          await navigator.mediaDevices.enumerateDevices()
        ).filter((d) => d.kind === "videoinput");
        setVideoDevices(devices);

        startedRef.current = true;
        onStarted?.();
      } catch (e) {
        console.error("publisher start failed:", e);
        onOpenChange(false);
      }
    })();
  }, [open, room, token, wsUrl, label, onOpenChange, onStarted]);

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

  const selectCamera = async (deviceId: string) => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
      });
      const newTrack = newStream.getVideoTracks()[0];

      const camPub = room?.localParticipant.getTrackPublication(
        Track.Source.Camera
      );
      const oldTrack = camPub?.track;

      if (oldTrack) {
        const newLocalTrack = await oldTrack.replaceTrack(newTrack, true);
        if (videoRef.current && newLocalTrack) {
          newLocalTrack.attach(videoRef.current);
        }
        if (room) await room.localParticipant.setCameraEnabled(true);
      } else {
        if (room)
          await room.localParticipant.setCameraEnabled(true, {
            deviceId: { exact: deviceId },
          });
      }

      newStream.getTracks().forEach((t) => {
        if (t !== newTrack) t.stop();
      });

      setCurrentDeviceId(deviceId);
    } catch (err) {
      console.error("select camera failed", err);
    }
  };

  const flipCamera = async () => {
    try {
      if (videoDevices.length < 2) return;

      const currentIndex = videoDevices.findIndex(
        (d) => d.deviceId === currentDeviceId
      );
      const nextDevice =
        videoDevices[
          (currentIndex + 1 + videoDevices.length) % videoDevices.length
        ];

      await selectCamera(nextDevice.deviceId);
    } catch (err) {
      console.error("flip camera failed", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[600px] overflow-hidden p-0">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

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

          {/* Camera controls */}
          {videoDevices.length === 2 && (
            <Button variant="default" onClick={flipCamera}>
              Flip Camera
            </Button>
          )}
          {videoDevices.length > 2 && (
            <Select
              onValueChange={selectCamera}
              value={currentDeviceId || undefined}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Camera" />
              </SelectTrigger>
              <SelectContent>
                {videoDevices.map((d) => (
                  <SelectItem key={d.deviceId} value={d.deviceId}>
                    {d.label || `Camera ${d.deviceId}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

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
