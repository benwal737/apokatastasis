import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useRoom } from "@/context/RoomContext";
import { getPovInfo, deleteRoom } from "../actions";
import { getInitials } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LocalParticipant,
  RemoteParticipant,
  TrackPublication,
} from "livekit-client";
import { toast } from "sonner";

type ParticipantInfo = {
  id: string;
  name: string;
  username: string;
  isLocal: boolean;
  isSpeaking: boolean;
};

const Avatar = ({
  className,
  children,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <div
    className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${
      className || ""
    }`}
    {...props}
  >
    {children}
  </div>
);

const AvatarFallback = ({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`flex h-full w-full items-center justify-center rounded-full bg-muted ${
      className || ""
    }`}
    {...props}
  >
    {children}
  </div>
);

const RoomManager = ({
  roomManagerOpen,
  setRoomManagerOpen,
  username,
  onStreamEnded,
  roomId,
  roomName,
}: {
  roomManagerOpen: boolean;
  setRoomManagerOpen: (open: boolean) => void;
  username: string | null;
  onStreamEnded?: () => void;
  roomId: string;
  roomName: string;
}) => {
  const router = useRouter();
  const { room } = useRoom();
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [endedParticipants, setEndedParticipants] = useState<Set<string>>(
    new Set()
  );
  const [endingParticipants, setEndingParticipants] = useState<Set<string>>(
    new Set()
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const participantHasActiveTracks = (
    p: RemoteParticipant | LocalParticipant
  ) => {
    const audioPubs: TrackPublication[] = [
      ...p.audioTrackPublications.values(),
    ];
    const videoPubs: TrackPublication[] = [
      ...p.videoTrackPublications.values(),
    ];

    const hasAudio = audioPubs.some((pub) => {
      if (!pub.track || pub.isMuted) return false;
      const track = pub.track.mediaStreamTrack;
      return track && track.readyState === "live" && track.enabled;
    });
    const hasVideo = videoPubs.some((pub) => {
      if (!pub.track || pub.isMuted) return false;
      const track = pub.track.mediaStreamTrack;
      return track && track.readyState === "live" && track.enabled;
    });

    return hasAudio || hasVideo;
  };

  const updateParticipants = useCallback(async () => {
    if (!room) return;
    setIsLoading(true);

    const local = room.localParticipant;
    const includeLocal = participantHasActiveTracks(local);
    const localInfo: ParticipantInfo | null = includeLocal
      ? {
          id: local.identity || "",
          name: local.name || "Host",
          username: username || "Host",
          isLocal: true,
          isSpeaking: !!local.isSpeaking,
        }
      : null;

    const remotes = Array.from(room.remoteParticipants.values()).filter((p) =>
      participantHasActiveTracks(p)
    );

    const remoteInfos = await Promise.all(
      remotes.map(async (p) => {
        try {
          const pov = await getPovInfo(p.identity);
          return {
            id: p.identity,
            name: p.name || pov?.username || "User",
            username: pov?.username || "User",
            isLocal: false,
            isSpeaking: !!p.isSpeaking,
          } as ParticipantInfo;
        } catch {
          return {
            id: p.identity,
            name: p.name || "User",
            username: "User",
            isLocal: false,
            isSpeaking: !!p.isSpeaking,
          } as ParticipantInfo;
        }
      })
    );

    const all = [...(localInfo ? [localInfo] : []), ...remoteInfos];
    setParticipants(all);
    setIsLoading(false);
  }, [room, username]);

  const stopLocalTracks = useCallback(async () => {
    if (!room) return;
    try {
      for (const pub of room.localParticipant.trackPublications.values()) {
        if (pub.track) {
          pub.track.stop();
          await room.localParticipant.unpublishTrack(pub.track);
        }
      }
    } catch (e) {
      console.error("Error stopping local tracks:", e);
    }
  }, [room]);

  // Setup listeners
  useEffect(() => {
    if (!room) return;
    updateParticipants();

    const recompute = () => void updateParticipants();
    room
      .on("participantConnected", recompute)
      .on("participantDisconnected", recompute)
      .on("trackPublished", recompute)
      .on("trackUnpublished", recompute)
      .on("trackSubscribed", recompute)
      .on("trackUnsubscribed", recompute)
      .on("localTrackPublished", recompute)
      .on("localTrackUnpublished", recompute)
      .on("trackMuted", recompute)
      .on("trackUnmuted", recompute);

    const attachSpeaking = (p: LocalParticipant | RemoteParticipant) =>
      p.on?.("isSpeakingChanged", recompute);
    const detachSpeaking = (p: LocalParticipant | RemoteParticipant) =>
      p.off?.("isSpeakingChanged", recompute);

    room.remoteParticipants.forEach(attachSpeaking);
    attachSpeaking(room.localParticipant);

    const onJoined = (p: LocalParticipant | RemoteParticipant) =>
      attachSpeaking(p);
    const onLeft = (p: LocalParticipant | RemoteParticipant) =>
      detachSpeaking(p);

    room.on("participantConnected", onJoined);
    room.on("participantDisconnected", onLeft);

    // data events
    let updateTimeout: NodeJS.Timeout | null = null;
    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        if (data.type === "end-stream") {
          const isTargetingMe =
            data.target === room.localParticipant.identity ||
            data.target === "*";

          if (isTargetingMe) {
            if (data.target === "*") {
              setEndedParticipants(new Set());
            }
            stopLocalTracks();
            onStreamEnded?.();
          } else if (data.target !== "*") {
            toast.info(`${data.target}'s stream has ended.`);
          }

          if (data.target === "*" || isTargetingMe) {
            if (updateTimeout) clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => {
              updateParticipants();
            }, 500);
          }
        }
      } catch (e) {
        console.error("Bad dataReceived payload", e);
      }
    };

    room.on("dataReceived", handleDataReceived);

    return () => {
      if (updateTimeout) clearTimeout(updateTimeout);

      room
        .off("participantConnected", recompute)
        .off("participantDisconnected", recompute)
        .off("trackPublished", recompute)
        .off("trackUnpublished", recompute)
        .off("trackSubscribed", recompute)
        .off("trackUnsubscribed", recompute)
        .off("localTrackPublished", recompute)
        .off("localTrackUnpublished", recompute)
        .off("trackMuted", recompute)
        .off("trackUnmuted", recompute)
        .off("dataReceived", handleDataReceived);

      room.remoteParticipants.forEach(detachSpeaking);
      detachSpeaking(room.localParticipant);
      room.off("participantConnected", onJoined);
      room.off("participantDisconnected", onLeft);
    };
  }, [room, updateParticipants, onStreamEnded, stopLocalTracks]);

  const broadcastEndEvent = (participantId: string) => {
    if (!room) return;
    room.localParticipant.publishData(
      new TextEncoder().encode(
        JSON.stringify({ type: "end-stream", target: participantId })
      ),
      { reliable: true }
    );
  };

  const handleEndStream = async (participantId: string) => {
    if (!room) return;

    if (
      endingParticipants.has(participantId) ||
      endedParticipants.has(participantId)
    ) {
      return;
    }

    setEndingParticipants((prev) => new Set(prev).add(participantId));

    if (room.localParticipant.identity === participantId) {
      await stopLocalTracks();
    }

    setEndedParticipants((prev) => new Set(prev).add(participantId));
    setEndingParticipants((prev) => {
      const newSet = new Set(prev);
      newSet.delete(participantId);
      return newSet;
    });

    broadcastEndEvent(participantId);

    updateParticipants();
  };

  const handleEndAllStreams = async () => {
    if (!room) return;

    setEndedParticipants(new Set());
    setEndingParticipants(new Set());

    await stopLocalTracks();
    broadcastEndEvent("*");
    toast.info("All streams have been ended.");
  };

  const handleDeleteRoom = async () => {
    if (!room) return;
    setIsDeleting(true);

    try {
      await deleteRoom(roomId);
      router.push("/");
      toast.success("Room deleted successfully");
    } catch (error) {
      console.error("Error deleting room:", error);
      toast.error("Failed to delete room");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <Drawer open={roomManagerOpen} onOpenChange={setRoomManagerOpen}>
      <DrawerContent className="max-h-[80vh] overflow-y-auto">
        <DrawerHeader className="border-b">
          <DrawerTitle className="text-xl font-semibold">
            Room Participants
          </DrawerTitle>
        </DrawerHeader>

        <div className="p-6 space-y-4">
          {isLoading ? (
            <div className="text-center py-4">Loading participants...</div>
          ) : participants.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No active participants
            </div>
          ) : (
            <div className="space-y-4">
              {participants
                .filter((p) => !endedParticipants.has(p.id))
                .map((participant) => (
                  <div
                    key={participant.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      participant.isSpeaking ? "bg-accent/50" : "bg-background"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {getInitials(
                            (
                              participant.name ||
                              participant.username ||
                              "U"
                            ).toString()
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {participant.name || "Anonymous"}
                          {participant.isLocal && (
                            <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          @{participant.username}
                        </div>
                      </div>
                    </div>
                    {!participant.isLocal && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleEndStream(participant.id)}
                        disabled={
                          endingParticipants.has(participant.id) ||
                          endedParticipants.has(participant.id)
                        }
                      >
                        {endingParticipants.has(participant.id)
                          ? "Ending..."
                          : endedParticipants.has(participant.id)
                          ? "Ended"
                          : "End Stream"}
                      </Button>
                    )}
                  </div>
                ))}
            </div>
          )}

          {participants.filter((p) => !endedParticipants.has(p.id)).length >
            1 && (
            <>
              <Separator className="my-4" />
              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  onClick={handleEndAllStreams}
                  disabled={isLoading}
                >
                  End All Streams
                </Button>
              </div>
            </>
          )}

          <Separator className="my-4" />
          <div className="flex justify-end">
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">Delete Room</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Room</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete &quot;{roomName}&quot;? This action
                    cannot be undone. All participants will be redirected to the
                    homepage.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteRoom}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete Room"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default RoomManager;
