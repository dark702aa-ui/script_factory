"use client";

import { useSearchParams } from "next/navigation";
import { GeneratorPanel } from "@/components/dashboard/generator-panel";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const chatId = searchParams.get("chat") || "default";

  return (
    <div className="flex h-full w-full flex-col overflow-hidden p-4 md:p-6">
      <div className="mb-4">
        <h1 className="font-display text-xl md:text-2xl font-bold text-foreground">Script Maker</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
          Describe the feature in plain language. Pick a framework and get production-ready FiveM code.
        </p>
      </div>

      <div className="flex-1 min-h-0 relative">
        <GeneratorPanel key={chatId} chatId={chatId} />
      </div>
    </div>
  );
}