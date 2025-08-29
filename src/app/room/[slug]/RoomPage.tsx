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
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SignedIn } from "@clerk/nextjs";
import { RoomProvider } from "@/context/RoomContext";
import { verifyJoinCode } from "../actions";
import { toast } from "sonner";

export default function RoomPage({
  room: initialRoom,
  viewerToken,
  wsUrl,
  userId,
}: {
  room: Room & { povs: Pov[] };
  viewerToken: string;
  wsUrl: string;
  userId: string | null;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [roomState, setRoomState] = useState(initialRoom);
  const [pubOpen, setPubOpen] = useState(false);
  const [pubToken, setPubToken] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
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
    console.log("userId", userId);
    console.log("hostId", roomState.hostId);
    setIsHost(userId === roomState.hostId);
    return () => {
      setIsMounted(false);
    };
  }, [roomState.hostId, userId, initialRoom]);

  const goLive = useCallback(
    async (title: string) => {
      if (!isMounted) return;
      setLoading(true);
      try {
        console.log("join code", joinCode);
        const valid = await verifyJoinCode(joinCode, roomState.id);
        console.log("valid", valid);
        if (!valid) {
          setJoinCodeError("Invalid join code");
          return;
        }
        setJoinCodeError(null);
        setDialogOpen(false);
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
    [isMounted, roomState.id, joinCode, roomState.povs]
  );

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
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
                <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
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
                      <Button
                        onClick={() => goLive(label)}
                        disabled={
                          !joinCode ||
                          !label ||
                          loading ||
                          joinCode.trim().length === 0 ||
                          label.trim().length === 0
                        }
                      >
                        Go Live
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </SignedIn>
            )}
          </div>
        </header>

        <ViewPanel
          povs={roomState.povs}
          myPovId={
            pubToken ? roomState.povs[roomState.povs.length - 1]?.id : undefined
          }
          onManage={(povId) => {
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
            console.log("Stream started");
            setIsLive(true);
          }}
          onStopped={() => {
            console.log("Stream stopped");
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
