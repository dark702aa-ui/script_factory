"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, Sparkles } from "lucide-react";

const STORAGE_KEY = "customInstructions";
const EXAMPLES = [
  "Always use oxmysql, never mysql-async.",
  "Prefer qb-target over qb-menu for interactions.",
  "Keep every export under the gf_ namespace.",
];

export default function SkillsPage() {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValue(localStorage.getItem(STORAGE_KEY) ?? "");
  }, []);

  function handleSave() {
    localStorage.setItem(STORAGE_KEY, value);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Skills &amp; Instructions</h1>
        <p className="text-sm text-muted-foreground">
          Standing instructions the AI engine follows on every generation — your
          conventions, preferred libraries, naming rules. Saved on this device and
          sent along with every request.
        </p>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-surface p-5">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`e.g.\n${EXAMPLES.join("\n")}`}
          className="min-h-[200px]"
        />
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} className="gap-2">
            {saved ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            {saved ? "Saved" : "Save instructions"}
          </Button>
          <span className="text-xs text-muted-foreground">
            Applied to client.lua, server.lua and config.lua generation.
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface-2 p-4">
        <p className="text-xs font-medium text-muted-foreground">Examples</p>
        <ul className="mt-2 space-y-1 font-mono text-xs text-muted-foreground">
          {EXAMPLES.map((ex) => (
            <li key={ex}>— {ex}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
