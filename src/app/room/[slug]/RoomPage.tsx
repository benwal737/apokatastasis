import React from "react";
import { Room } from "@/types";
import { Button } from "@/components/ui/button";

const RoomPage = ({ room }: { room: Room }) => {
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
        <Button>Add Pov</Button>
      </div>
    </div>
  );
};

export default RoomPage;
