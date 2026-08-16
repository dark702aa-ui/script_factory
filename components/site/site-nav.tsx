"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, LogOut, Sparkles, Terminal, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { SignInModal } from "@/components/auth/sign-in-modal";

export function SiteNav() {
  const { user, signIn, signOut } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="sf-ai-orb flex h-8 w-8 items-center justify-center text-accent">
            <Terminal className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-semibold">Script Factory</span>
        </Link>

        <nav className="hidden gap-8 font-mono text-sm text-muted-foreground md:flex">
          <Link href="/#make" className="hover:text-foreground">
            ai make
          </Link>
          <Link href="/#features" className="hover:text-foreground">
            features
          </Link>
          <Link href="/#security" className="hover:text-foreground">
            security
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="hidden items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground sm:flex"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-foreground sm:flex">
                <User className="h-3 w-3 text-accent" />
                {user.name}
              </span>
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5 text-xs text-muted-foreground">
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setModalOpen(true)}
                className="hidden text-sm text-muted-foreground hover:text-foreground sm:block"
              >
                Sign in
              </button>
              <Button asChild size="sm" className="gap-1.5">
                <Link href="/#make">
                  <Sparkles className="h-3.5 w-3.5" />
                  Start building
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <SignInModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSignIn={(name) => {
          signIn(name);
          setModalOpen(false);
        }}
      />
    </header>
  );
}
