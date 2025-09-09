import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRef, useEffect, useState } from "react";
import { Track, Participant } from "livekit-client";

export type Tile = {
  pubSid: string;
  participantIdentity: string;
  participant: Participant;
  label: string;
  attach: (el: HTMLMediaElement) => void;
  detach: (el: HTMLMediaElement) => void;
  source?: Track.Source;
  isLocal?: boolean;
};

export default function VideoTile({
  tile,
  isMine,
  onManage,
}: {
  tile: Tile;
  isMine: boolean;
  onManage?: (povId: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const videoEl = videoRef.current;
    const audioEl = audioRef.current;
    if (!videoEl || !audioEl) return;
    tile.attach(videoEl);

    return () => {
      if (videoEl) tile.detach(videoEl);
      if (audioEl) {
        const micPub = tile.participant.getTrackPublication(
          Track.Source.Microphone
        );
        micPub?.track?.detach(audioEl);
      }
    };
  }, [tile]);

  return (
    <Card className="relative overflow-hidden pt-2">
      <CardHeader className="h-2 px-4">
        <CardTitle className="text-md">
          {tile.label}
          <span className="text-muted-foreground">
            {tile.isLocal ? " (You)" : ""}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className="aspect-video w-full object-cover"
        />
        <audio ref={audioRef} autoPlay muted={muted} className="hidden" />
      </CardContent>
      <div className="absolute bottom-2 right-2">
        {!isMine && (
          <Button
            size="sm"
            variant={muted ? "secondary" : "default"}
            onClick={() => {
              if (muted) {
                setMuted(false);
                if (audioRef.current) {
                  const micPub = tile.participant.getTrackPublication(
                    Track.Source.Microphone
                  );
                  micPub?.track?.attach(audioRef.current);
                }
              } else {
                setMuted(true);
                if (audioRef.current) {
                  const micPub = tile.participant.getTrackPublication(
                    Track.Source.Microphone
                  );
                  micPub?.track?.detach(audioRef.current);
                }
              }
            }}
          >
            {muted ? "Unmute" : "Mute"}
          </Button>
        )}
      </div>
      {isMine && onManage && (
        <div className="absolute bottom-2 right-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onManage?.(tile.participantIdentity)}
          >
            Manage
          </Button>
        </div>
      )}
    </Card>
  );
}
