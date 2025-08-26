"use client";

import { useTransition, useState, useRef } from "react";
import { Room } from "@/types";
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

const WHIP = String(IngressInput.WHIP_INPUT);

type IngressType = typeof WHIP;

const formSchema = z.object({
  label: z.string().min(1, "Min 1 character").max(15, "Max 15 characters"),
});

const RoomPage = ({ room }: { room: Room }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: "",
    },
  });

  const closeRef = useRef<HTMLButtonElement>(null);
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      startTransition(async () => {
        await createIngress(parseInt(WHIP), room.id, values.label);
        closeRef.current?.click();
      });
    } catch (error) {
      console.error("Form submission error", error);
      toast.error("Failed to submit the form. Please try again.");
      closeRef.current?.click();
    }
  }
  return (
    <div className="p-6 h-full w-full">
      <h1 className="text-2xl font-bold">{room.name}</h1>
      <p className="text-muted-foreground">{room.joinCode}</p>
      <div className="grid grid-cols-2 gap-6 my-6">
        {room.povs.map((pov) => (
          <div key={pov.id}>
            <p>{pov.label}</p>
          </div>
        ))}
        <Button onClick={() => setModalOpen(true)}>Add Pov</Button>
      </div>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Pov</DialogTitle>
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
                      <Input placeholder="Label" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button
                    type="button"
                    ref={closeRef}
                    variant="destructive"
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isPending} variant="default">
                  Add Pov
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
