"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { ModeToggle } from "@/components/navigation/mode-toggle";
import { useSession } from "@/components/providers/session-provider";
import { APP_NAME } from "@/lib/config";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon } from "@hugeicons/core-free-icons";

export function Navbar() {
  const { isSignedIn } = useSession();
  const ctaHref = isSignedIn ? "/dashboard" : "/sign-in";

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/brand-logo.png" alt={APP_NAME} className="h-7 w-auto object-contain sm:h-8" />
          <span className="text-base font-semibold sm:text-xl">{APP_NAME}</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-4 sm:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="https://docs.ship.rajbreno.com" target="_blank" rel="noopener noreferrer">
              Docs
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="https://github.com/rajbreno/ship-superfast" target="_blank" rel="noopener noreferrer">
              Open Source
            </Link>
          </Button>
          <ModeToggle />
          <Button asChild size="sm">
            <Link href={ctaHref}>
              {isSignedIn ? "Dashboard" : "Sign In"}
            </Link>
          </Button>
        </div>

        {/* Mobile nav */}
        <div className="flex items-center gap-2 sm:hidden">
          <ModeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <HugeiconsIcon icon={Menu01Icon} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>{APP_NAME}</SheetTitle>
                <SheetDescription className="sr-only">Navigation</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-2 px-6">
                <SheetClose asChild>
                  <Button asChild variant="ghost" size="lg">
                    <Link href="https://docs.ship.rajbreno.com" target="_blank" rel="noopener noreferrer">
                      Docs
                    </Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button asChild variant="ghost" size="lg">
                    <Link href="https://github.com/rajbreno/ship-superfast" target="_blank" rel="noopener noreferrer">
                      Open Source
                    </Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button asChild size="lg">
                    <Link href={ctaHref}>
                      {isSignedIn ? "Dashboard" : "Sign In"}
                    </Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
