"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Copy, Check, ArrowRight } from "lucide-react";

export default function PromptGeneratorPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generatePrompt = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: topic }),
      });
      if (!res.ok) throw new Error("Failed to generate prompt");
      const data = await res.json();
      setGeneratedPrompt(data.prompt);
    } catch (e) {
      console.error(e);
      // Fallback
      const promptTemplate = `I need a complete FiveM script for: ${topic}\n\nPlease include:\n1. Detailed features and configurable options.\n2. Both Client and Server side logic.\n3. Optimizations and exploit prevention.`;
      setGeneratedPrompt(promptTemplate);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendToScriptMaker = () => {
    sessionStorage.setItem("draftPrompt", generatedPrompt);
    router.push("/dashboard");
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Prompt Generator</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate highly optimized prompts to use in the Script Maker. Describe what you want simply, and we&apos;ll format it for the best results.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-surface p-6">
        <label className="block text-sm font-medium text-foreground">What do you want to build?</label>
        <Textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. A bank robbery script with drill minigame and police alerts..."
          className="min-h-[100px] text-base"
        />
        <Button onClick={generatePrompt} disabled={isGenerating || !topic.trim()} className="w-full sm:w-auto gap-2">
          <Wand2 className="h-4 w-4" />
          {isGenerating ? "Formatting..." : "Generate Optimized Prompt"}
        </Button>
      </div>

      {generatedPrompt && (
        <div className="space-y-4 rounded-xl border border-accent/20 bg-accent/5 p-6 animate-in fade-in slide-in-from-bottom-4">
          <label className="block text-sm font-medium text-foreground">Optimized Prompt</label>
          <Textarea
            value={generatedPrompt}
            readOnly
            className="min-h-[150px] bg-background text-foreground"
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={copyToClipboard} className="gap-2 bg-background">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy to Clipboard"}
            </Button>
            <Button onClick={sendToScriptMaker} className="gap-2">
              Send to Script Maker <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}