"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { MessageInput } from "@/types";
import { Message } from "@prisma/client";
import { socket } from "@/lib/socketClient";
import { sendMessage } from "../actions";

const RoomChat = ({
  userId,
  roomId,
  initialMessages,
  username,
}: {
  userId: string | null;
  roomId: string;
  initialMessages: Message[];
  username: string | null;
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    socket.on("connect", () => {
      socket.emit("join_room", roomId);
    });

    socket.on("new_message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    return () => {
      socket.off("connect");
      socket.off("new_message");
      socket.off("connect_error");
    };
  }, [roomId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !username || !userId) return;

    const messageInput: MessageInput = {
      senderId: userId,
      roomId: roomId,
      content: newMessage,
      username: username,
    };

    const message: Message = {
      id: Date.now().toString(),
      roomId: roomId,
      senderId: userId,
      username: username,
      content: newMessage,
      sentAt: new Date(),
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");

    try {
      const message = await sendMessage(messageInput);
      socket.emit("send_message", roomId, message);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: Date | string) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg">Chat</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {messages.map((message) => {
          return (
            <div
              key={message.id}
              className="w-full px-2 py-1 hover:bg-muted/50 rounded text-sm group"
            >
              <div className="mb-1">
                <span className="font-bold">
                  {message.username || "Anonymous"}:
                </span>{" "}
                <span className="break-words font-light">{message.content}</span>
              </div>
              <div className="flex justify-end">
                <span className="text-xs text-muted-foreground opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  {formatTime(message.sentAt)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t">
        <div className="flex space-x-2 items-center">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 h-8"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="size-8"
          >
            <Send />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoomChat;
