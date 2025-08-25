import Image from "next/image";
import { UserIcon } from "lucide-react";

export default function Home() {
  const streams = [
    {
      id: 1,
      title: "Stream 1",
      streamer: "Kai Cenat",
      description: "Description 1",
      thumbnail: "/cctv.webp",
    },
    {
      id: 2,
      title: "Stream 2",
      streamer: "Shadow Lord",
      description: "Description 2",
      thumbnail: "/cctv.webp",
    },
    {
      id: 3,
      title: "Stream 3",
      streamer: "Random Channel",
      description: "Description 3",
      thumbnail: "/cctv.webp",
    },
    {
      id: 4,
      title: "Stream 4",
      streamer: "Random Event",
      description: "Description 4",
      thumbnail: "/cctv.webp",
    },
  ];
  return (
    <div className="flex flex-col h-screen m-6">
      <h1 className="text-2xl font-bold mb-4">For You</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {streams.map((stream) => (
          <div key={stream.id} className="flex flex-col gap-2">
            <Image
              className="border border-border"
              src={stream.thumbnail}
              alt={stream.title}
              width={800}
              height={400}
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-full bg-sidebar flex items-center justify-center">
                  <UserIcon className="size-4" />
                </div>
                <h2 className="text-lg font-semibold">{stream.title}</h2>
              </div>

              <span className="text-sm text-muted-foreground pl-8">
                {stream.streamer}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
