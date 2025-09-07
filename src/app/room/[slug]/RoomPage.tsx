"use client";

import { useState, useCallback, useEffect } from "react";
import { Room, Pov } from "@prisma/client";
import { Button } from "@/components/ui/button";
import PublisherDialog from "./PublisherDialog";
import ViewPanel from "./ViewPanel";
import { createBrowserPov } from "@/livekit/createBrowserPov";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SignedIn } from "@clerk/nextjs";
import { RoomProvider } from "@/context/RoomContext";
import { verifyJoinCode } from "../actions";
import { toast } from "sonner";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@radix-ui/react-hover-card";
import { Card, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";
import RoomManager from "./RoomManager";

export default function RoomPage({
  room: initialRoom,
  viewerToken,
  wsUrl,
  userId,
  username,
}: {
  room: Room & { povs: Pov[] };
  viewerToken: string;
  wsUrl: string;
  userId: string | null;
  username: string | null;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [roomState, setRoomState] = useState(initialRoom);
  const [pubOpen, setPubOpen] = useState(false);
  const [pubToken, setPubToken] = useState("");
  const [publisherDialogOpen, setPublisherDialogOpen] = useState(false);
  const [roomManagerOpen, setRoomManagerOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [roomToken, setRoomToken] = useState(viewerToken);
  const [isLive, setIsLive] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinCodeError, setJoinCodeError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setRoomState(initialRoom);
    setIsHost(userId === roomState.hostId);
    return () => {
      setIsMounted(false);
    };
  }, [roomState.hostId, userId, initialRoom]);

  // Polling fallback to detect room deletion for viewers who don't receive LiveKit data messages
  useEffect(() => {
    if (!isMounted) return;

    const pollRoomExists = async () => {
      try {
        const response = await fetch(`/api/room/${roomState.id}/exists`);
        if (!response.ok && response.status === 404) {
          console.log("Room no longer exists - redirecting via polling");
          toast.error("This room has been deleted by the host.");
          window.location.href = "/";
        }
      } catch (error) {
        console.error("Error checking room existence:", error);
      }
    };

    // Poll every 3 seconds to check if room still exists
    const pollInterval = setInterval(pollRoomExists, 3000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [roomState.id, isMounted]);


  const handleRTMP = useCallback(async () => {
    if (!isMounted) return;
    setLoading(true);
    try {
      const valid = await verifyJoinCode(joinCode, roomState.id);
      if (!valid) {
        setJoinCodeError("Invalid join code");
        return;
      }
      toast.error("RTMP not implemented yet...");
    } catch (error) {
      console.error("Failed to go live:", error);
    } finally {
      setLoading(false);
    }
  }, [isMounted, roomState.id, joinCode]);

  const goLive = useCallback(
    async (title: string) => {
      if (!isMounted) return;
      setLoading(true);
      try {
        const valid = await verifyJoinCode(joinCode, roomState.id);
        if (!valid) {
          setJoinCodeError("Invalid join code");
          return;
        }
        setJoinCodeError(null);
        setPublisherDialogOpen(false);
        const { token, pov } = await createBrowserPov(roomState.id, title);
        setRoomToken(token);
        setPubToken(token);
        setPubOpen(true);
        setRoomState((prev) => ({
          ...prev,
          povs: [...prev.povs, pov],
        }));
      } catch (error) {
        console.error("Failed to go live:", error);
      } finally {
        setLoading(false);
      }
    },
    [isMounted, roomState.id, joinCode]
  );

  const handleDialogOpenChange = (open: boolean) => {
    setPublisherDialogOpen(open);
    setLoading(false);
    setJoinCodeError(null);
    setLabel("");
    setJoinCode("");
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <RoomProvider wsUrl={wsUrl} token={roomToken}>
      <div className="p-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{roomState.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            {isHost && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setRoomManagerOpen(true)}
              >
                <Settings className="size-5" />
              </Button>
            )}
            {isHost && (
              <Button
                variant="outline"
                onClick={() => {
                  const code = roomState.joinCode;
                  if (!code) {
                    toast.error("No join code available");
                    return;
                  }
                  navigator.clipboard.writeText(code);
                  toast.success("Join code copied to clipboard");
                }}
              >
                Copy Join Code
              </Button>
            )}
            {!isLive && (
              <SignedIn>
                <Dialog
                  open={publisherDialogOpen}
                  onOpenChange={handleDialogOpenChange}
                >
                  <DialogTrigger asChild>
                    <Button>Go Live</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Stream Details</DialogTitle>
                    </DialogHeader>
                    <Input
                      placeholder="Join Code"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                    />
                    {joinCodeError && (
                      <p className="text-destructive">{joinCodeError}</p>
                    )}
                    <Input
                      placeholder="Stream Title"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                    />
                    <DialogFooter>
                      <HoverCard openDelay={200} closeDelay={200}>
                        <HoverCardTrigger>
                          <Button
                            className="w-full"
                            onClick={() => goLive(label)}
                            disabled={
                              !joinCode ||
                              !label ||
                              loading ||
                              joinCode.trim().length === 0 ||
                              label.trim().length === 0
                            }
                          >
                            Go Live (Browser)
                          </Button>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80 mt-2">
                          <Card>
                            <CardContent>
                              <p className="text-sm">
                                Use WebRTC to go live through your browser using
                                your device&apos;s camera and microphone
                              </p>
                            </CardContent>
                          </Card>
                        </HoverCardContent>
                      </HoverCard>
                      <HoverCard openDelay={200} closeDelay={200}>
                        <HoverCardTrigger>
                          <Button
                            className="w-full"
                            onClick={() => handleRTMP()}
                            disabled={
                              !joinCode ||
                              !label ||
                              loading ||
                              joinCode.trim().length === 0 ||
                              label.trim().length === 0
                            }
                          >
                            Go Live (RTMP)
                          </Button>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80 mt-2">
                          <Card>
                            <CardContent>
                              <p className="text-sm">
                                Use RTMP to go live through an external encoder
                                or streaming software (e.g. OBS Studio)
                              </p>
                            </CardContent>
                          </Card>
                        </HoverCardContent>
                      </HoverCard>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </SignedIn>
            )}
          </div>
          <RoomManager
            roomManagerOpen={roomManagerOpen}
            setRoomManagerOpen={setRoomManagerOpen}
            username={username}
            roomId={roomState.id}
            roomName={roomState.name}
            onStreamEnded={() => {
              setPubOpen(false);
              setIsLive(false);
              setPubToken("");
            }}
          />
        </header>

        <ViewPanel
          onManage={() => {
            setPubOpen(true);
          }}
        />

        <PublisherDialog
          open={pubOpen}
          onOpenChange={(isOpen) => {
            setPubOpen(isOpen);
            if (!isOpen) {
              setPubToken("");
            }
          }}
          onStarted={() => {
            setIsLive(true);
          }}
          onStopped={() => {
            setIsLive(false);
            setPubToken("");
          }}
          wsUrl={wsUrl}
          token={pubToken}
          label={label}
        />
      </div>
    </RoomProvider>
  );
}
