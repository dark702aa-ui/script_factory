import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditorWindow } from "@/components/site/editor-window";
import { SiteNav } from "@/components/site/site-nav";
import { Terminal } from "lucide-react";
import Link from "next/link";

const HERO_FILES = [
  {
    name: "client.lua",
    lines: [
      { text: "-- Gas station robbery: client trigger", tone: "comment" as const },
      { text: "RegisterNetEvent('gf:startRobbery')", tone: "keyword" as const },
      { text: "AddEventHandler('gf:startRobbery', function(station)", tone: "default" as const },
      { text: "  local ped = PlayerPedId()", tone: "default" as const },
      { text: "  TriggerServerEvent('gf:beginTimer', station)", tone: "keyword" as const },
      { text: "end)", tone: "default" as const },
    ],
  },
  {
    name: "server.lua",
    lines: [
      { text: "-- Validates cooldown, alerts police at 40%", tone: "comment" as const },
      { text: "RegisterServerEvent('gf:beginTimer')", tone: "keyword" as const },
      { text: "AddEventHandler('gf:beginTimer', function(station)", tone: "default" as const },
      { text: "  if not Cooldowns[station] then", tone: "default" as const },
      { text: "    Cooldowns[station] = os.time() + Config.Cooldown", tone: "default" as const },
      { text: "  end", tone: "default" as const },
      { text: "end)", tone: "default" as const },
    ],
  },
  {
    name: "config.lua",
    lines: [
      { text: "Config = {}", tone: "keyword" as const },
      { text: "Config.Cooldown = 180", tone: "default" as const },
      { text: "Config.AlertThreshold = 0.4", tone: "default" as const },
    ],
  },
  {
    name: "install.sql",
    lines: [
      { text: "CREATE TABLE IF NOT EXISTS gf_robberies (", tone: "keyword" as const },
      { text: "  id INT AUTO_INCREMENT PRIMARY KEY,", tone: "default" as const },
      { text: "  station VARCHAR(50)", tone: "default" as const },
      { text: ");", tone: "default" as const },
    ],
  },
];

const FEATURES = [
  {
    command: "/generate",
    title: "Core AI Engine",
    desc: "Natural language in, Arabic or English. client.lua, server.lua, config.lua and SQL out.",
  },
  {
    command: "/debug",
    title: "Debugger",
    desc: "Paste broken code, get the corrected version with a plain-language explanation of the fix.",
  },
  {
    command: "/optimize",
    title: "Performance Optimizer",
    desc: "Refactors loops and native calls to cut resource ms without changing behavior.",
  },
  {
    command: "/convert",
    title: "Framework Converter",
    desc: "Migrate a script between ESX and QBCore. Anything ambiguous gets flagged for review, not guessed.",
  },
  {
    command: "/conflict-check",
    title: "Conflict Detector",
    desc: "Compare two scripts for clashing exports, events, or globals before they hit production.",
  },
];

const SECURITY_CHECKS = [
  {
    rule: "SQL injection",
    desc: "Queries built with string concatenation are blocked before they reach you — parameterized queries only.",
  },
  {
    rule: "Arbitrary code execution",
    desc: "os.execute, io.popen, loadstring, and dofile with dynamic content are never allowed in generated code.",
  },
  {
    rule: "Implicit globals",
    desc: "Variables declared without `local` are flagged — a common source of resource-to-resource collisions.",
  },
  {
    rule: "Unvalidated economy calls",
    desc: "Money and item functions get checked for range/type validation before they're treated as safe.",
  },
];

const FAQS = [
  {
    q: "Do I need to know Lua to use this?",
    a: "No — describe the feature in plain language, Arabic or English, and Script Factory writes the Lua. Reading the output helps if you want to tweak it, but it isn't required.",
  },
  {
    q: "Is the generated code safe to drop into a live server?",
    a: "Every script passes through an AST-based sanitizer before you see it — it blocks SQL injection patterns, arbitrary code execution, and a few other common vulnerabilities. Still review it like you would any new resource before going live.",
  },
  {
    q: "Which frameworks are supported?",
    a: "ESX and QBCore today. The Framework Converter can migrate an existing script between the two.",
  },
  {
    q: "What if the generated script has a bug?",
    a: "Use the Debugger — paste the broken code and get a corrected version with a plain-language explanation of the fix.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Describe the script",
    desc: "Plain language, either language — \"a gas station robbery with a police alert at 40%.\"",
  },
  {
    n: "02",
    title: "Review the files",
    desc: "Client, server, config and SQL come back tabbed, sanitized, and explained.",
  },
  {
    n: "03",
    title: "Drop it in",
    desc: "Download the zip, drop it in your resources folder, add it to server.cfg.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
        <div>
          <Badge variant="outline" className="mb-5 font-mono text-xs text-muted-foreground">
            for ESX &amp; QBCore
          </Badge>
          <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Describe the script.
            <br />
            <span className="text-accent">Get working Lua.</span>
          </h1>
          <p className="mt-5 max-w-md text-muted-foreground">
            Script Factory turns a plain-language request into client.lua, server.lua,
            config.lua and the SQL to match — sanitized before it ships.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/dashboard">Start building</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="#how-it-works">See how it works</Link>
            </Button>
          </div>
          <div className="mt-8 flex gap-2 font-mono text-xs text-muted-foreground">
            <Badge variant="outline">ESX</Badge>
            <Badge variant="outline">QBCore</Badge>
            <Badge variant="outline">Arabic &amp; English prompts</Badge>
          </div>
        </div>

        <EditorWindow files={HERO_FILES} activeFile={0} />
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-surface/40 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            Five tools, one script.
          </h2>
          <p className="mt-2 max-w-lg text-muted-foreground">
            Every module below runs on the same generated code, from first draft to
            production-ready.
          </p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.command}
                className="rounded-lg border border-border bg-surface p-5 transition-colors hover:border-accent/40"
              >
                <span className="font-mono text-xs text-code">{f.command}</span>
                <h3 className="mt-3 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <Badge variant="outline" className="mb-4 font-mono text-xs text-muted-foreground">
                AST-based, not regex
              </Badge>
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">
                Sanitized before you ever see it.
              </h2>
              <p className="mt-3 max-w-md text-muted-foreground">
                Generated code is parsed into a real Lua AST and checked against a
                fixed rule set — not just scanned for suspicious keywords.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {SECURITY_CHECKS.map((c) => (
                  <div key={c.rule} className="rounded-lg border border-border bg-surface p-4">
                    <h3 className="font-display text-sm font-semibold text-foreground">
                      {c.rule}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-border bg-surface">
              <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-4 py-2.5">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-border" />
                  <span className="h-2.5 w-2.5 rounded-full bg-border" />
                  <span className="h-2.5 w-2.5 rounded-full bg-border" />
                </div>
                <span className="ms-2 font-mono text-xs text-muted-foreground">sanitizer output</span>
              </div>
              <div className="overflow-x-auto px-5 py-4 font-mono text-[13px] leading-relaxed">
                <div className="text-muted-foreground">-- server.lua, line 14</div>
                <div className="text-foreground/90">
                  MySQL.query(
                  <span className="text-destructive">'SELECT * FROM users WHERE id = ' .. id</span>
                  )
                </div>
                <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  critical · sql_concatenation — use a parameterized placeholder instead of "..".
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            Three steps, start to server.cfg.
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n}>
                <span className="font-mono text-sm text-accent">{s.n}</span>
                <h3 className="mt-2 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border bg-surface/40 py-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">Questions, answered.</h2>
          <div className="mt-10 divide-y divide-border rounded-lg border border-border bg-surface">
            {FAQS.map((item) => (
              <details key={item.q} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-display text-base font-medium text-foreground">
                  {item.q}
                  <span className="ms-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl font-semibold">Ready to generate your first script?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              No credit card needed to try a single generation.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/dashboard">Start building</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 sm:grid-cols-[1fr_auto] sm:items-start">
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-accent" />
              <span className="font-display text-sm font-semibold">Script Factory</span>
            </div>
            <p className="mt-2 max-w-xs text-xs text-muted-foreground">
              AI-assisted Lua script generation for FiveM&apos;s ESX and QBCore frameworks.
            </p>
          </div>
          <nav className="flex gap-8 font-mono text-xs text-muted-foreground">
            <a href="#features" className="hover:text-foreground">features</a>
            <a href="#security" className="hover:text-foreground">security</a>
            <a href="#faq" className="hover:text-foreground">faq</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
