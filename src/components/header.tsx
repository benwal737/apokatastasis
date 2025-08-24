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

export function Header() {
  return (
    <header className="flex h-[var(--header-height)] items-center justify-between gap-4 border-b px-4 w-full bg-background z-50 sticky top-0">
      <Link href="/" className="flex items-center gap-x-4">
        <span className="font-semibold text-2xl">Apokatastasis</span>
      </Link>
      <div className="flex items-center w-1/2">
        <Input placeholder="Search..." />
      </div>
      <div className="flex items-center gap-x-4">
        <SignedOut>
          <SignInButton>
            <Button variant="ghost">Sign in</Button>
          </SignInButton>
          <SignUpButton>
            <Button>Sign up</Button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
}
