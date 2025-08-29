"use client";

import { Room } from "@prisma/client";
import { User } from "@prisma/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface RoomWithHost extends Room {
  host: User;
}
export default function Home({ rooms }: { rooms: RoomWithHost[] }) {
  const router = useRouter();
  return (
    <div className="flex flex-col h-screen m-6">
      <h1 className="text-2xl font-bold mb-4">For You</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {rooms.map((room: RoomWithHost) => (
          <Card key={room.id}>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2">
                  <Image
                    src={room.host.imageUrl}
                    alt={room.host.username}
                    className="size-8 rounded-full"
                    width={40}
                    height={40}
                  />
                  <h2 className="text-lg font-semibold">{room.name}</h2>
                </div>
                <span className="text-sm text-muted-foreground pl-10">
                  {room.host.username}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => {
                  router.push(`/room/${room.slug}`);
                }}
              >
                Join
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
