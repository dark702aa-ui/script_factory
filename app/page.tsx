"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteNav } from "@/components/site/site-nav";
import { MeshBackground } from "@/components/effects/mesh-background";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";
import { GeneratorPanel } from "@/components/dashboard/generator-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowDown, Code, LayoutDashboard, Shield, Sparkles, Zap } from "lucide-react";

export default function LandingPage() {
  const searchParams = useSearchParams();
  const chatId = searchParams.get("chat") || "landing";

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans selection:bg-accent/20">
      <OnboardingTour />
      <SiteNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 lg:pt-32 lg:pb-20">
        <MeshBackground />

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="mx-auto flex max-w-3xl flex-col items-center space-y-8 text-center">
            <Badge
              variant="secondary"
              className="flex items-center gap-2 rounded-full border-accent/20 bg-accent/10 px-3 py-1 text-accent"
            >
              <Sparkles className="h-3.5 w-3.5 animate-float" />
              <span className="text-xs font-medium uppercase tracking-wide">Powered by Llama 3.3 70B on Groq</span>
            </Badge>

            <h1 className="text-5xl font-semibold tracking-tight text-foreground md:text-7xl">
              Code faster.
              <br className="hidden md:block" />
              <span className="sf-text-gradient">Build better servers.</span>
            </h1>

            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              Transform plain natural language into production-ready Lua scripts for FiveM. Fully typed,
              AST-sanitized, and optimized for ESX and QBCore.
            </p>

            <div className="flex flex-col items-center gap-4 pt-4 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-full px-8 text-base shadow-lg transition-all hover:shadow-accent/20">
                <a href="#make">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Start Building — it&apos;s free
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 rounded-full border-border/50 px-8 text-base hover:bg-surface-2">
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Open Dashboard
                </Link>
              </Button>
            </div>

            <a
              href="#make"
              className="flex animate-float items-center gap-1.5 pt-6 font-mono text-xs text-muted-foreground hover:text-foreground"
            >
              Try it right now, no sign-up
              <ArrowDown className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* Live AI Maker */}
      <section id="make" className="relative scroll-mt-20 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-10 max-w-2xl text-center flex flex-col items-center">
            <div className="ai-liquid-orb h-20 w-20 mb-5 rounded-full flex items-center justify-center text-white shadow-2xl">
              <Sparkles className="h-8 w-8 drop-shadow-md" />
            </div>
            
            <h2 className="font-display text-3xl font-semibold text-foreground">AI Make</h2>
            <p className="mt-2 text-muted-foreground">
              This is the real generator — describe a feature, pick ESX or QBCore, and get working code.
              Everything here runs live and saves to your device.
            </p>
          </div>

          <div className="sf-neon-border relative mx-auto h-[70vh] max-h-[720px] min-h-[520px] max-w-6xl overflow-hidden rounded-2xl border border-border/60 bg-surface/60 p-3 backdrop-blur-sm md:p-4">
            <GeneratorPanel key={chatId} chatId={chatId} />
          </div>
        </div>
      </section>

      {/* Feature Grid (بدون فواصل حادة) */}
      <section id="features" className="relative bg-surface/30 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-4 rounded-2xl border border-border/50 bg-background p-6 transition-colors hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                <Code className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Semantic Generation</h3>
              <p className="leading-relaxed text-muted-foreground">
                Powered by Llama 3.3 70B, running on Groq&apos;s inference infrastructure for fast responses.
                Trained heavily on Lua 5.4 and FiveM natives — it understands game logic, not just syntax.
              </p>
            </div>
            <div id="security" className="scroll-mt-20 space-y-4 rounded-2xl border border-border/50 bg-background p-6 transition-colors hover:border-accent/40 hover:shadow-lg hover:shadow-emerald-500/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">AST Sanitization</h3>
              <p className="leading-relaxed text-muted-foreground">
                Before output reaches you, the code is parsed into a real Lua AST to statically detect dynamic
                code injection or unsafe natives.
              </p>
            </div>
            <div className="space-y-4 rounded-2xl border border-border/50 bg-background p-6 transition-colors hover:border-accent/40 hover:shadow-lg hover:shadow-amber-500/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Iterative Refinement</h3>
              <p className="leading-relaxed text-muted-foreground">
                Don&apos;t settle for the first draft. Use the chat to modify features, upload your own files for
                context, and debug instantly.
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