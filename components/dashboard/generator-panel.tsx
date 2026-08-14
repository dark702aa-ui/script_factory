"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Loader2, Sparkles } from "lucide-react";

type GeneratedFiles = {
  supported?: boolean;
  client_lua?: string;
  server_lua?: string;
  config_lua?: string;
  install_sql?: string;
  nui_html?: string;
  explanation?: string;
};

const FILE_LABELS: Record<keyof GeneratedFiles, string> = {
  client_lua: "client.lua",
  server_lua: "server.lua",
  config_lua: "config.lua",
  install_sql: "install.sql",
  nui_html: "nui/index.html",
  explanation: "notes",
};

// Local, per-device history — no backend/auth yet, so this keeps the History
// page useful in the meantime. Swap for a real `scripts` table write once a
// database is wired up (see the architecture doc).
function pushToHistory(entry: { prompt: string; framework: string; language: string }) {
  try {
    const raw = localStorage.getItem("scriptHistory");
    const list = raw ? JSON.parse(raw) : [];
    list.unshift({ id: crypto.randomUUID(), timestamp: Date.now(), ...entry });
    localStorage.setItem("scriptHistory", JSON.stringify(list.slice(0, 20)));
  } catch {
    // localStorage unavailable (e.g. private browsing) — history just won't persist.
  }
}

export function GeneratorPanel() {
  const [prompt, setPrompt] = useState("");
  const [framework, setFramework] = useState<"esx" | "qbcore">("esx");
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedFiles | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const customInstructions = localStorage.getItem("customInstructions") ?? "";
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, framework, language, customInstructions }),
      });
      if (!res.ok) throw new Error("Generation failed. Try rephrasing the request.");
      const data: GeneratedFiles = await res.json();
      setResult(data);
      if (data.supported !== false) {
        pushToHistory({ prompt, framework, language });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const fileKeys = (Object.keys(FILE_LABELS) as (keyof GeneratedFiles)[]).filter(
    (k) => k !== "explanation" && result?.[k]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      {/* Prompt column */}
      <div className="space-y-4 rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">New script</h2>
          <Badge variant="outline" className="font-mono text-xs">
            /generate
          </Badge>
        </div>

        <div className="flex gap-2">
          <Select value={framework} onValueChange={(v) => setFramework(v as "esx" | "qbcore")}>
            <SelectTrigger className="font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="esx">ESX</SelectItem>
              <SelectItem value="qbcore">QBCore</SelectItem>
            </SelectContent>
          </Select>
          <Select value={language} onValueChange={(v) => setLanguage(v as "en" | "ar")}>
            <SelectTrigger className="font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ar">العربية</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. A gas station robbery job with a 3-minute cooldown, police alert at 40% completion, and a shared loot table in the database."
          className="min-h-[160px] resize-none font-mono text-sm"
          dir={language === "ar" ? "rtl" : "ltr"}
        />

        <Button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="w-full gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Generating…" : "Generate script"}
        </Button>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {result?.explanation && result.supported !== false && (
          <div className="rounded-md border border-border bg-surface-2 p-3 text-sm text-muted-foreground">
            {result.explanation}
          </div>
        )}
      </div>

      {/* Output column */}
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        {!result ? (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-2 p-10 text-center text-muted-foreground">
            <Sparkles className="h-6 w-6" />
            <p className="font-mono text-sm">No script generated yet</p>
            <p className="text-sm">Describe what you need and the files will show up here.</p>
          </div>
        ) : result.supported === false ? (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-2 p-10 text-center text-muted-foreground">
            <Badge variant="outline" className="mb-2">out of scope</Badge>
            <p className="max-w-sm text-sm text-foreground">{result.explanation}</p>
            <p className="max-w-sm text-sm">
              Try describing an ESX or QBCore feature instead — a job, shop, HUD, or
              vehicle system.
            </p>
          </div>
        ) : (
          <Tabs defaultValue={fileKeys[0]} className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border bg-surface-2 px-3">
              <TabsList className="h-auto bg-transparent p-0">
                {fileKeys.map((key) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="rounded-none border-b-2 border-transparent px-4 py-3 font-mono text-xs data-[state=active]:border-accent data-[state=active]:bg-transparent"
                  >
                    {FILE_LABELS[key]}
                  </TabsTrigger>
                ))}
              </TabsList>
              <Button variant="ghost" size="sm" className="gap-1.5 font-mono text-xs">
                <Download className="h-3.5 w-3.5" />
                Download .zip
              </Button>
            </div>
            {fileKeys.map((key) => (
              <TabsContent key={key} value={key} className="mt-0 flex-1">
                <pre className="h-full overflow-auto px-5 py-4 font-mono text-[13px] leading-relaxed text-foreground/90">
                  {result[key]}
                </pre>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}
