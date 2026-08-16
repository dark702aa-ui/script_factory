"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignInModal({
  open,
  onClose,
  onSignIn,
}: {
  open: boolean;
  onClose: () => void;
  onSignIn: (name: string) => void;
}) {
  const [name, setName] = useState("");

  if (!open) return null;

  function submit() {
    if (!name.trim()) return;
    onSignIn(name);
    setName("");
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="sf-neon-border animate-fade-in-up relative w-full max-w-sm overflow-hidden rounded-2xl border border-border/60 bg-surface p-6 shadow-2xl">
        <div className="sf-glow-blob sf-glow-blob--accent sf-glow-blob--sm pointer-events-none -right-12 -top-12" />

        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 text-muted-foreground transition hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative z-10">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="sf-ai-orb h-9 w-9 text-accent">
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 className="font-display text-lg font-semibold">Sign in to Script Factory</h2>
          </div>

          <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
            This project has no backend account system yet — this just saves a
            display name on this device so the dashboard can greet you and
            show your local stats. Nothing is sent to a server.
          </p>

          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Your name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="e.g. Abdulaziz"
            className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent"
          />

          <Button onClick={submit} disabled={!name.trim()} className="w-full">
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
