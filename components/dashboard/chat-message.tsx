"use client";

import { Bot, Terminal, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Message } from "@/lib/chat-types";

export function ChatMessage({
  message,
  language,
  onViewResult,
}: {
  message: Message;
  language: "en" | "ar";
  onViewResult: () => void;
}) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-accent text-accent-foreground" : "border border-border bg-surface-2 text-muted-foreground"
        }`}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      <div
        className={`max-w-[85%] rounded-lg p-3 text-sm ${
          isUser
            ? "rounded-tr-sm bg-accent text-accent-foreground"
            : "rounded-tl-sm border border-border bg-surface-2 text-foreground"
        }`}
        dir={isUser && language === "ar" ? "rtl" : "ltr"}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.result && message.result.supported !== false && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full gap-2 border-border/50 bg-surface/50 text-xs"
            onClick={onViewResult}
          >
            <Terminal className="h-3 w-3" />
            View generated files
          </Button>
        )}
      </div>
    </div>
  );
}
