"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from "react";
import { Room } from "livekit-client";

export const RoomContext = createContext<{
  room: Room | null;
  isConnecting: boolean;
  error: Error | null;
}>({
  room: null,
  isConnecting: false,
  error: null,
});

export function RoomProvider({
  children,
  wsUrl,
  token,
}: {
  children: ReactNode;
  wsUrl: string;
  token: string;
}) {
  const [room] = useState(
    () => new Room({ adaptiveStream: true, dynacast: true })
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const currentToken = useRef(token);

  useEffect(() => {
    currentToken.current = token;
    if (room.state === "connected") {
      // reconnect with new token if already connected
      room.disconnect().then(() => {
        room.connect(wsUrl, token).catch(console.error);
      });
    }
  }, [token, wsUrl, room]);

  useEffect(() => {
    if (!wsUrl || !currentToken.current) return;

    const connect = async () => {
      try {
        setIsConnecting(true);
        setError(null);
        await room.connect(wsUrl, currentToken.current, {
          autoSubscribe: true,
          maxRetries: 3,
        });
      } catch (err) {
        console.error("Failed to connect to room:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to connect to room")
        );
      } finally {
        setIsConnecting(false);
      }
    };

    connect();

    return () => {
      if (room.state === "connected") {
        room.disconnect().catch(console.error);
      }
    };
  }, [room, wsUrl]);


  return (
    <RoomContext.Provider value={{ room, isConnecting, error }}>
      {children}
    </RoomContext.Provider>
  );
}

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error("useRoom must be used within a RoomProvider");
  }
  return context;
};
