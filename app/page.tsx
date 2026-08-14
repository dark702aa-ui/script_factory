import Link from "next/link";
import { SiteNav } from "@/components/site/site-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditorWindow } from "@/components/site/editor-window";
import { Code, Shield, Zap, Sparkles, ArrowRight } from "lucide-react";

const HERO_FILES = [
  {
    name: "request",
    content: "// The developer's request:\n\"I need a complete bank robbery script. \\nIt should require a drill item to start, \\ntake 5 minutes to drill, alert the police at 40% completion, \\nand give money bags upon success. Make it for QBCore.\"",
    language: "typescript",
  },
  {
    name: "server.lua",
    content: "local QBCore = exports['qb-core']:GetCoreObject()\n\nQBCore.Functions.CreateCallback('bankrobbery:server:HasDrill', function(source, cb)\n    local Player = QBCore.Functions.GetPlayer(source)\n    if Player then\n        local item = Player.Functions.GetItemByName(Config.DrillItem)\n        cb(item ~= nil)\n    else\n        cb(false)\n    end\nend)",
    language: "lua",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans selection:bg-accent/20">
      <SiteNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-background pointer-events-none" />
        
        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="flex flex-col items-center text-center space-y-8 max-w-3xl mx-auto">
            <Badge variant="secondary" className="px-3 py-1 rounded-full bg-accent/10 text-accent border-accent/20 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-xs font-medium tracking-wide uppercase">Introducing Gemini 2.5 Flash</span>
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-foreground">
              Code faster.<br className="hidden md:block" />
              <span className="text-muted-foreground">Build better servers.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Transform plain natural language into production-ready Lua scripts for FiveM. Fully typed, AST-sanitized, and optimized for ESX and QBCore.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Button asChild size="lg" className="h-12 px-8 text-base rounded-full shadow-lg hover:shadow-accent/20 transition-all">
                <Link href="/dashboard">
                  Open Workspace
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base rounded-full border-border/50 hover:bg-surface-2">
                <Link href="/dashboard/prompt-generator">Try Prompt Generator</Link>
              </Button>
            </div>
          </div>

          {/* Interactive Preview Window */}
          <div className="mt-20 lg:mt-32 w-full max-w-5xl mx-auto rounded-xl border border-border/50 shadow-2xl bg-surface/50 backdrop-blur-sm overflow-hidden">
             <div className="flex items-center gap-2 border-b border-border/50 bg-surface px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="ml-4 flex items-center bg-surface-2 rounded-md px-3 py-1 border border-border/50 text-xs font-mono text-muted-foreground">
                  script_factory — workspace
                </div>
             </div>
             <div className="p-4 bg-background/50">
               <EditorWindow files={HERO_FILES} activeFile={0} />
             </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 bg-surface/30 border-y border-border/30">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4 p-6 rounded-2xl bg-background border border-border/50 transition-colors hover:border-accent/40">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Code className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold">Semantic Generation</h3>
              <p className="text-muted-foreground leading-relaxed">
                Powered by Gemini models trained heavily on Lua 5.4 and FiveM natives. It understands game logic, not just syntax.
              </p>
            </div>
            <div className="space-y-4 p-6 rounded-2xl bg-background border border-border/50 transition-colors hover:border-accent/40">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold">AST Sanitization</h3>
              <p className="text-muted-foreground leading-relaxed">
                Before output reaches you, the code is parsed into a real Lua AST to statically detect dynamic code injection or unsafe natives.
              </p>
            </div>
            <div className="space-y-4 p-6 rounded-2xl bg-background border border-border/50 transition-colors hover:border-accent/40">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold">Iterative Refinement</h3>
              <p className="text-muted-foreground leading-relaxed">
                Don&apos;t settle for the first draft. Use the workspace chat to modify features, upload your own files for context, and debug instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center text-muted-foreground">
        <p className="text-sm">Built for modern FiveM communities. Not affiliated with Rockstar Games.</p>
      </footer>
    </div>
  );
}