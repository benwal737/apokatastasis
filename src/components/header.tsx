"use client";

import { Button } from "@/components/ui/button";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { Input } from "./ui/input";
import { ModeToggle } from "./mode-toggle";
import { useRouter } from "next/navigation";

export function Header({
  hideSearch,
  hideCreate,
}: {
  hideSearch?: boolean;
  hideCreate?: boolean;
}) {
  const router = useRouter();
  const HeaderIcons = () => {
    const userButtonAppearance = {
      elements: {
        userButtonAvatarBox: "w-10 h-10",
      },
    };
    return <UserButton appearance={userButtonAppearance} />;
  };
  return (
    <header className="flex h-[var(--header-height)] items-center justify-between gap-4 border-b px-2 md:px-4 w-full bg-background z-50 sticky top-0">
      <Link href="/" className="flex items-center gap-x-4">
        <span className="font-semibold text-xl md:text-2xl">Apokatastasis</span>
      </Link>

      <div className="md:flex items-center w-1/2 hidden" hidden={hideSearch}>
        <Input placeholder="This doesn't do anything yet..." />
      </div>
      <div className="flex items-center gap-x-2 md:gap-x-4">
        <SignedOut>
          <SignInButton>
            <Button variant="outline" className="w-20">
              Sign in
            </Button>
          </SignInButton>
          <SignUpButton>
            <Button className="w-20">Sign up</Button>
          </SignUpButton>
        </SignedOut>
        <ModeToggle />
        <SignedIn>
          <Button
            variant="default"
            onClick={() => {
              router.push("/room/create");
            }}
            hidden={hideCreate}
          >
            Create Room
          </Button>
          <HeaderIcons />
        </SignedIn>
      </div>
    </header>
  );
}
