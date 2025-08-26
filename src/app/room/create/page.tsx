"use client";

import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { createRoom } from "../actions";
import { RoomInput } from "@/types";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(1, "Min 1 character").max(15, "Max 15 characters"),
  chatEnabled: z.boolean().optional(),
});

const page = () => {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      chatEnabled: true,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const slug = await createRoom(values as RoomInput);
      toast.success("Room created successfully");
      router.push(`/room/${slug}`);
    } catch (error) {
      console.error("Form submission error", error);
      toast.error("Failed to submit the form. Please try again.");
    }
  }
  return (
    <div className="p-6 flex h-full items-center justify-center">
      <Card className="w-1/2">
        <CardHeader>
          <CardTitle className="font-bold text-2xl">Create Room</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Room" type="" {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="chatEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Enable Chat</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        defaultChecked={true}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.watch("name") === ""}>
                Create
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default page;
