"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, History as HistoryIcon, Trash2, Code, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

type Message = {
  id: string;
  role: "user" | "model";
  content: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result?: any;
};

type HistoryEntry = {
  id: string;
  title: string;
  messages: Message[];
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let initialEntries: HistoryEntry[] = [];
    try {
      const raw = localStorage.getItem("scriptHistory");
      if (raw) {
        initialEntries = JSON.parse(raw);
      }
    } catch {
      // Ignored
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntries(initialEntries);
  }, []);

  function handleDelete(id: string) {
    if (!entries) return;
    const filtered = entries.filter((e) => e.id !== id);
    setEntries(filtered);
    localStorage.setItem("scriptHistory", JSON.stringify(filtered));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">History</h1>
        <p className="text-sm text-muted-foreground">
          Your last generations on this device. Now includes the full chat history and generated code.
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
          {entries.map((entry) => {
            const isExpanded = expandedId === entry.id;
            const finalResult = entry.messages?.slice().reverse().find(m => m.result)?.result;
            
            return (
              <div key={entry.id} className="flex flex-col p-4 transition-colors hover:bg-surface-2/50">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : entry.id)}>
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      <p className="truncate text-sm font-medium text-foreground">{entry.title || (entry as any).prompt}</p>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground ml-6">
                      <Clock className="h-3 w-3" />
                      {timeAgo(entry.timestamp)}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline">{entry.framework?.toUpperCase() || "ESX"}</Badge>
                    <Badge variant="outline">{entry.language === "ar" ? "AR" : "EN"}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 ml-6 space-y-4">
                    {entry.messages ? (
                      <div className="space-y-3 rounded-md border border-border bg-background p-4 text-sm max-h-[300px] overflow-y-auto">
                        {entry.messages.map((m) => (
                          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[90%] p-2 rounded-md ${m.role === "user" ? "bg-accent/10 text-accent-foreground" : "bg-surface text-muted-foreground"}`}>
                              <p className="whitespace-pre-wrap text-xs">{m.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Legacy history entry (only title saved).</p>
                    )}
                    
                    {finalResult && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {['client_lua', 'server_lua', 'config_lua'].map((k) => finalResult[k] && (
                          <div key={k} className="rounded-md border border-border bg-background overflow-hidden">
                            <div className="bg-surface-2 px-3 py-1.5 border-b border-border flex items-center gap-2">
                              <Code className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs font-mono font-medium">{k.replace("_", ".")}</span>
                            </div>
                            <pre className="p-3 text-[11px] font-mono text-muted-foreground max-h-[200px] overflow-y-auto">
                              {finalResult[k]}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
