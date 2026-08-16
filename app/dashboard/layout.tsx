"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  History as HistoryIcon,
  Sparkles,
  Terminal,
  Wand2,
  Code2,
  Trash2,
  LogOut,
  User,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SignInModal } from "@/components/auth/sign-in-modal";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/prompt-generator", label: "Prompt Generator", icon: Wand2 },
  { href: "/dashboard/history", label: "History", icon: HistoryIcon },
  { href: "/dashboard/skills", label: "Skills & Instructions", icon: Sparkles },
];

type HistoryItem = {
  id: string;
  title?: string;
  scriptName?: string;
  timestamp?: number;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signIn, signOut } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const loadHistory = () => {
    const saved = localStorage.getItem("scriptHistory") || localStorage.getItem("script_factory_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  };

  useEffect(() => {
    loadHistory();
    window.addEventListener("storage", loadHistory);
    return () => window.removeEventListener("storage", loadHistory);
  }, []);

  const handleDeleteHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    localStorage.setItem("scriptHistory", JSON.stringify(updated));
    localStorage.setItem("script_factory_history", JSON.stringify(updated));
  };

  return (
    // dir is set explicitly here (not just a class) because the chat/sidebar
    // layout below is built LTR-first — the root <html> is still lang="ar"
    // dir="rtl" for the marketing site, this just opts the dashboard shell out.
    <div dir="ltr" className="relative flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <div className="sf-glow-blob sf-glow-blob--accent sf-glow-blob--sm pointer-events-none absolute -left-16 -top-16 z-0" />

      <aside className="relative z-10 flex w-64 shrink-0 flex-col border-r border-border bg-surface/95 backdrop-blur-sm">
        {/* Brand */}
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <span className="sf-ai-orb flex h-8 w-8 items-center justify-center text-accent">
            <Terminal className="h-4 w-4" />
          </span>
          <span className="font-display text-base font-bold tracking-wide">Script Factory</span>
        </div>

        {/* Jump to the live generator on the homepage */}
        <div className="p-3">
          <Link
            href="/#make"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground shadow-lg transition hover:opacity-90 active:scale-[0.98]"
          >
            <Sparkles className="h-4 w-4" />
            <span>Open AI Maker</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 px-3 py-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-surface-2 text-foreground"
                    : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Saved Chats / History List */}
        <div className="flex flex-1 flex-col overflow-hidden px-3 pt-4">
          <div className="mb-2 flex items-center justify-between px-2 text-xs font-semibold uppercase text-muted-foreground">
            <span>Recent Scripts</span>
            <span className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
              {history.length}
            </span>
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto pr-1">
            {history.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No saved chats yet</p>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => router.push(`/?chat=${item.id}#make`)}
                  className="group flex cursor-pointer items-center justify-between rounded-lg p-2 text-xs text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Code2 className="h-3.5 w-3.5 shrink-0 text-accent" />
                    <span className="truncate">{item.title || item.scriptName || "Untitled Script"}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteHistory(e, item.id)}
                    className="p-1 opacity-0 transition hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Account + model footer */}
        <div className="space-y-2 border-t border-border p-3">
          {user ? (
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2">
              <span className="flex items-center gap-1.5 truncate text-xs text-foreground">
                <User className="h-3.5 w-3.5 shrink-0 text-accent" />
                <span className="truncate">{user.name}</span>
              </span>
              <button onClick={signOut} className="text-muted-foreground hover:text-destructive">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setModalOpen(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition hover:border-accent/50 hover:text-foreground"
            >
              <User className="h-3.5 w-3.5" />
              Sign in
            </button>
          )}
          <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-center font-mono text-xs text-muted-foreground">
            Groq · llama-3.3-70b
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="relative z-10 h-full min-w-0 flex-1 overflow-y-auto bg-background">
        {children}
      </main>

      <SignInModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSignIn={(name) => {
          signIn(name);
          setModalOpen(false);
        }}
      />
    </div>
  );
}
