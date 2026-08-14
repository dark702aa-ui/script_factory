"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, History as HistoryIcon } from "lucide-react";

type HistoryEntry = {
  id: string;
  prompt: string;
  framework: "esx" | "qbcore";
  language: "en" | "ar";
  timestamp: number;
};

function timeAgo(ts: number): string {
  const diffMins = Math.floor((Date.now() - ts) / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const hours = Math.floor(diffMins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("scriptHistory");
      setEntries(raw ? JSON.parse(raw) : []);
    } catch {
      setEntries([]);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">History</h1>
        <p className="text-sm text-muted-foreground">
          Your last generations on this device. Account-based sync across devices
          is next up.
        </p>
      </div>

      {entries === null ? (
        <div className="rounded-lg border border-border bg-surface p-10 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface p-12 text-center text-muted-foreground">
          <HistoryIcon className="h-6 w-6" />
          <p className="font-mono text-sm">No scripts yet</p>
          <p className="text-sm">Generate a script and it will show up here.</p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border bg-surface">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{entry.prompt}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {timeAgo(entry.timestamp)}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Badge variant="outline">{entry.framework.toUpperCase()}</Badge>
                <Badge variant="outline">{entry.language === "ar" ? "AR" : "EN"}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
