"use client";

import { useCallback, useEffect, useState } from "react";

export type SFUser = { name: string; joinedAt: number };

const STORAGE_KEY = "sf_user";
const EVENT_NAME = "sf-auth-changed";

function readUser(): SFUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SFUser) : null;
  } catch {
    return null;
  }
}

/**
 * NOTE: this is intentionally a local-only, on-device "session".
 * There is no backend/database in this project, so real accounts
 * (shared across devices, password-protected, etc.) would need a
 * proper auth provider (NextAuth.js + a DB) wired up server-side.
 * This hook is the honest, no-backend version: it lets the UI greet
 * the person by name and gate a couple of dashboard touches without
 * pretending to be a secure multi-device account system.
 */
export function useAuth() {
  const [user, setUser] = useState<SFUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(readUser());
    setReady(true);

    function onChange() {
      setUser(readUser());
    }
    window.addEventListener(EVENT_NAME, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT_NAME, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const signIn = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const next: SFUser = { name: trimmed, joinedAt: Date.now() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore — still update in-memory state below
    }
    setUser(next);
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  const signOut = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setUser(null);
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  return { user, ready, signIn, signOut };
}
