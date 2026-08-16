"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Code2,
  History as HistoryIcon,
  Sparkles,
  Wand2,
  Layers,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type HistoryEntry = {
  id: string;
  title?: string;
  framework?: "esx" | "qbcore";
  timestamp?: number;
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [skillsCount, setSkillsCount] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("scriptHistory") || localStorage.getItem("script_factory_history");
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      // ignore
    }
    try {
      setGeneratedCount(parseInt(localStorage.getItem("generationCount") ?? "0", 10) || 0);
    } catch {
      // ignore
    }
    try {
      const skillsRaw = localStorage.getItem("script-factory-skills");
      if (skillsRaw) setSkillsCount((JSON.parse(skillsRaw) as unknown[]).length);
    } catch {
      // ignore
    }
  }, []);

  const frameworkCounts = history.reduce<Record<string, number>>((acc, h) => {
    const fw = h.framework || "esx";
    acc[fw] = (acc[fw] || 0) + 1;
    return acc;
  }, {});
  const topFramework =
    Object.entries(frameworkCounts).sort((a, b) => b[1] - a[1])[0]?.[0]?.toUpperCase() || "—";

  const stats = [
    { label: "Scripts generated", value: generatedCount, icon: Sparkles, color: "text-accent" },
    { label: "Saved chats", value: history.length, icon: HistoryIcon, color: "text-blue-400" },
    { label: "Custom skills", value: skillsCount, icon: Layers, color: "text-emerald-400" },
    { label: "Top framework", value: topFramework, icon: Code2, color: "text-amber-400" },
  ];

  return (
    <div className="relative mx-auto max-w-5xl space-y-8 p-4 md:p-8">
      <div className="sf-glow-blob sf-glow-blob--code sf-glow-blob--sm pointer-events-none absolute -right-10 top-0 z-0" />

      <div className="relative z-10">
        <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
          {greeting()}{user ? `, ${user.name}` : ""}
        </p>
        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything below is stored locally on this device — no server database yet.
        </p>
      </div>

      {/* Stats grid */}
      <div className="relative z-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="animate-fade-in-up rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/40"
          >
            <Icon className={`mb-2 h-4 w-4 ${color}`} />
            <p className="font-display text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="relative z-10 grid gap-4 md:grid-cols-3">
        <Link
          href="/#make"
          className="sf-neon-border group flex flex-col justify-between rounded-2xl border border-accent/30 bg-surface p-5 transition hover:-translate-y-0.5"
        >
          <div>
            <span className="sf-ai-orb mb-3 flex h-10 w-10 items-center justify-center text-accent">
              <Sparkles className="h-[18px] w-[18px]" />
            </span>
            <h3 className="font-semibold text-foreground">AI Maker</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              The live generator now lives on the homepage — jump back in.
            </p>
          </div>
          <span className="mt-4 flex items-center gap-1 text-xs font-medium text-accent">
            Open <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </Link>

        <Link
          href="/dashboard/prompt-generator"
          className="group flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 transition hover:border-accent/40 hover:-translate-y-0.5"
        >
          <div>
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Wand2 className="h-[18px] w-[18px]" />
            </span>
            <h3 className="font-semibold text-foreground">Prompt Generator</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Turn a rough idea into a detailed, ready-to-paste spec.
            </p>
          </div>
          <span className="mt-4 flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-foreground">
            Open <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </Link>

        <Link
          href="/dashboard/skills"
          className="group flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 transition hover:border-accent/40 hover:-translate-y-0.5"
        >
          <div>
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Layers className="h-[18px] w-[18px]" />
            </span>
            <h3 className="font-semibold text-foreground">Skills & Instructions</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Teach the generator your server&apos;s conventions.
            </p>
          </div>
          <span className="mt-4 flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-foreground">
            Open <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </Link>
      </div>

      {/* Recent activity */}
      <div className="relative z-10 rounded-2xl border border-border bg-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Recent activity</h3>
          <Link href="/dashboard/history" className="text-xs text-accent hover:underline">
            View all
          </Link>
        </div>
        {history.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nothing yet — generate your first script from the AI Maker.
          </p>
        ) : (
          <div className="space-y-1.5">
            {history.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-surface-2"
              >
                <span className="flex items-center gap-2 truncate">
                  <Code2 className="h-3.5 w-3.5 shrink-0 text-accent" />
                  <span className="truncate text-foreground">{item.title || "Untitled Script"}</span>
                </span>
                <span className="shrink-0 font-mono text-[11px]">{(item.framework || "esx").toUpperCase()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
