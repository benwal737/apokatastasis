"use client";

import { useTransition, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Room, Pov } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createIngress } from "@/livekit/ingress";
import { IngressInput } from "livekit-server-sdk";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { startWhip, stopWhip } from "@/lib/whipClient";
import ViewerClient from "./ViewerClient";
import { getViewerToken } from "@/lib/token-service";

const formSchema = z.object({
  label: z.string().min(1, "Min 1 character").max(15, "Max 15 characters"),
});

interface RoomPageProps {
  room: Room & { povs: Pov[] };
  token: string;
}

const RoomPage = ({ room, token }: RoomPageProps) => {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [liveMap, setLiveMap] = useState<
    Record<string, "idle" | "connecting" | "live">
  >({});
  const closeRef = useRef<HTMLButtonElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { label: "" },
  });

  const setStatus = (povId: string, s: "idle" | "connecting" | "live") =>
    setLiveMap((m) => ({ ...m, [povId]: s }));

  async function handleGoLive(povId: string) {
    try {
      setStatus(povId, "connecting");
      await startWhip(povId);
      setStatus(povId, "live");
      toast.success("Streaming started");
    } catch (e) {
      console.error(e);
      setStatus(povId, "idle");
      toast.error("Failed to start stream");
    }
  }

  async function handleStop(povId: string) {
    try {
      await stopWhip(povId);
      setStatus(povId, "idle");
      toast.success("Streaming stopped");
    } catch (e) {
      console.error(e);
      toast.error("Failed to stop stream");
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        const ingress = await createIngress(
          IngressInput.WHIP_INPUT, // ✅ pass enum directly
          room.id,
          values.label
        );
        // Optimistically go live using the returned povId
        closeRef.current?.click();
        form.reset();
        // Optional: refresh server data so the new POV appears in the list
        router.refresh();

        await handleGoLive(ingress.povId);
      } catch (error) {
        console.error("Form submission error", error);
        toast.error("Failed to create POV / ingress");
        closeRef.current?.click();
      }
    });
  }

  return (
    <div className="p-6 h-full w-full">
      <h1 className="text-2xl font-bold">{room.name}</h1>
      <p className="text-muted-foreground">{room.joinCode}</p>

      <div className="grid grid-cols-2 gap-6 my-6">
        {room.povs.map((pov) => {
          const status = liveMap[pov.id] ?? "idle";
          const isConnecting = status === "connecting";
          const isLive = status === "live";
          const roomName = pov.userId;

          return (
            <Card key={pov.id} className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{pov.label}</span>
                  <span
                    className={`text-sm ${
                      isLive
                        ? "text-green-600"
                        : isConnecting
                        ? "text-amber-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {isLive ? "LIVE" : isConnecting ? "Connecting…" : "Idle"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Hide secrets from UI; show only type/ids helpful for debugging */}
                <p className="text-xs text-muted-foreground break-all">
                  Ingress ID: {pov.ingressId ?? "—"}
                </p>
                <ViewerClient token={token} roomName={roomName} />
                <div className="flex gap-2">
                  {!isLive ? (
                    <Button
                      size="sm"
                      onClick={() => handleGoLive(pov.id)}
                      disabled={isConnecting}
                    >
                      {isConnecting ? "Starting…" : "Go Live (WHIP)"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleStop(pov.id)}
                    >
                      Stop
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        <Button onClick={() => setModalOpen(true)}>Add POV</Button>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add POV</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl>
                      <Input placeholder="Camera A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" ref={closeRef} variant="secondary">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Adding…" : "Add POV (WHIP)"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoomPage;
