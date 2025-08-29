"use client";

import { useState, useCallback, useEffect } from "react";
import { Room, Pov } from "@prisma/client";
import { Button } from "@/components/ui/button";
import PublisherDialog from "./PublisherDialog";
import ActiveViewer from "./ActiveViewer";
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

export default function RoomPage({
  room: initialRoom,
  viewerToken,
  wsUrl,
}: {
  room: Room & { povs: Pov[] };
  viewerToken: string;
  wsUrl: string;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [roomState, setRoomState] = useState(initialRoom);
  const [pubOpen, setPubOpen] = useState(false);
  const [pubToken, setPubToken] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [roomToken, setRoomToken] = useState(viewerToken);
  const [myPovId, setMyPovId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  const goLive = useCallback(
    async (title: string) => {
      if (!isMounted) return;
      try {
        const { token, pov } = await createBrowserPov(roomState.id, title);
        setRoomToken(token);
        setPubToken(token);
        setPubOpen(true);
        setRoomState((prev) => ({
          ...prev,
          povs: [...prev.povs, pov],
        }));
        setMyPovId(pov.id);
      } catch (error) {
        console.error("Failed to go live:", error);
      }
    },
    [isMounted, roomState.id]
  );

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
            <p className="text-muted-foreground">{roomState.joinCode}</p>
          </div>
        </header>

        <ActiveViewer
          povs={roomState.povs}
          myPovId={
            pubToken ? roomState.povs[roomState.povs.length - 1]?.id : undefined
          }
          onManage={(povId) => {
            setPubOpen(true);
          }}
        />

        <SignedIn>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>Go Live</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Go Live</DialogTitle>
              </DialogHeader>
              <Input
                placeholder="Title"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
              <Button onClick={() => goLive(label)}>Go Live</Button>
              <DialogFooter>
                <DialogClose asChild>
                  <Button>Close</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </SignedIn>

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
          }}
          onStopped={() => {
            console.log("Stream stopped");
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
