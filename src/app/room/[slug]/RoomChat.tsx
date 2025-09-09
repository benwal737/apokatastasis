"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { MessageInput } from "@/types";
import { Message } from "@prisma/client";

const RoomChat = ({
  userId,
  roomId,
}: {
  userId: string | null;
  roomId: string;
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      roomId: "1",
      senderId: userId,
      content: "Yo",
      sentAt: new Date(),
    },
    {
      id: "2",
      roomId: "1",
      senderId: userId,
      content: "Whats up",
      sentAt: new Date(),
    },
    {
      id: "3",
      roomId: "1",
      senderId: userId,
      content: "Test",
      sentAt: new Date(),
    },
  ]);

  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const messageInput: MessageInput = {
      senderId: userId || "",
      roomId: roomId,
      content: newMessage,
    };

    const message: Message = {
      id: Date.now().toString(),
      roomId: roomId,
      senderId: userId || "",
      content: newMessage,
      sentAt: new Date(),
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");

    console.log("Sending message:", messageInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString("en-US", {
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
          const isOwnMessage = message.senderId === userId;
          return (
            <div
              key={message.id}
              className="w-full px-2 py-1 hover:bg-muted/50 rounded text-sm group"
            >
              <div className="mb-1">
                <span
                  className={`font-medium ${
                    isOwnMessage ? "text-primary" : "text-foreground"
                  }`}
                >
                  {isOwnMessage ? "You" : message.senderId}:
                </span>{" "}
                <span className="text-foreground break-words">
                  {message.content}
                </span>
              </div>
              <div className="flex justify-end">
                <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
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
