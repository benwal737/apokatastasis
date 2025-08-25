import { SignUp } from "@clerk/nextjs";
import { UserPlus, MessageSquare, Radio, Cctv } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="bg-muted grid flex-1 lg:grid-cols-2">
      <div className="hidden flex-1 items-center justify-end p-6 md:p-10 lg:flex">
        <ul className="max-w-sm space-y-8">
          <li>
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4" />
              <p className="font-semibold">Chat</p>
            </div>
            <p className="text-muted-foreground mt-2 text-sm">
              Join the conversation and chat with others in the stream.
            </p>
          </li>
          <li>
            <div className="flex items-center gap-2">
              <UserPlus className="size-4" />
              <p className="font-semibold">Follow</p>
            </div>
            <p className="text-muted-foreground mt-2 text-sm">
              Follow your favorite channels and never miss when they go live.
            </p>
          </li>
          <li>
            <div className="flex items-center gap-2">
              <Radio className="size-4" />
              <p className="font-semibold">Go Live</p>
            </div>
            <p className="text-muted-foreground mt-2 text-sm">
              Go live and share your stream with the world.
            </p>
          </li>
          <li>
            <div className="flex items-center gap-2">
              <Cctv className="size-4" />
              <p className="font-semibold">Host POV</p>
            </div>
            <p className="text-muted-foreground mt-2 text-sm">
              Join other streams as an additional POV contributor.
            </p>
          </li>
        </ul>
      </div>
      <div className="flex flex-1 items-center justify-center p-6 md:p-10 lg:justify-start">
        <SignUp />
      </div>
    </div>
  );
}
