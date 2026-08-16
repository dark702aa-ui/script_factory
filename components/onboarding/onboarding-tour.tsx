"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, History, ShieldCheck, Sparkles, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const SLIDES = [
  {
    icon: Sparkles,
    title: "Describe it, build it — right here",
    body: "Scroll down and type what you want in plain English or Arabic. No sign-up needed to try a generation.",
  },
  {
    icon: ShieldCheck,
    title: "Safety built in",
    body: "Every script is parsed into a real Lua AST before it reaches you, catching unsafe natives or injected code automatically.",
  },
  {
    icon: Wand2,
    title: "Prompt Generator & Skills",
    body: "Turn a rough idea into a detailed spec, or teach the AI your server's conventions — both live in the Dashboard.",
  },
  {
    icon: History,
    title: "Everything saved on this device",
    body: "Your chats and generated scripts are kept in this browser's History. Sign in to give the dashboard a name.",
  },
];

const STORAGE_KEY = "sf_onboarded";

export function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // if localStorage is unavailable, just skip the tour silently
    }
  }, []);

  function close() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  const slide = SLIDES[step];
  const Icon = slide.icon;
  const isLast = step === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" onClick={close} />
      <div className="sf-neon-border animate-fade-in-up relative w-full max-w-md overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-2xl">
        <div className="sf-glow-blob sf-glow-blob--accent sf-glow-blob--sm pointer-events-none -right-10 -top-10" />

        <button
          onClick={close}
          className="absolute right-3 top-3 z-10 text-muted-foreground transition hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative z-10 p-6">
          <span className="sf-ai-orb mb-4 flex h-12 w-12 items-center justify-center text-accent">
            <Icon className="h-6 w-6" />
          </span>

          <h2 className="mb-2 font-display text-xl font-semibold">{slide.title}</h2>
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{slide.body}</p>

          <div className="mb-5 flex items-center gap-1.5">
            {SLIDES.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-accent" : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <button onClick={close} className="text-xs text-muted-foreground hover:text-foreground">
              Skip
            </button>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  className="gap-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </Button>
              )}
              <Button size="sm" onClick={() => (isLast ? close() : setStep((s) => s + 1))} className="gap-1.5">
                {isLast ? "Start building" : "Next"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
