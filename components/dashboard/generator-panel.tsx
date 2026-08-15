"use client";

import { useEffect, useRef, useState } from "react";
import JSZip from "jszip";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Toast } from "@/components/ui/toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AttachMenu, AttachmentChips } from "@/components/dashboard/attach-menu";
import { ChatMessage } from "@/components/dashboard/chat-message";
import { OutputPanel } from "@/components/dashboard/output-panel";
import { StarterPrompts } from "@/components/dashboard/starter-prompts";
import { useLocalWorkspace, type Attachment } from "@/hooks/useLocalWorkspace";
import { useToast } from "@/hooks/useToast";
import { FILE_LABELS, type FileKey, type GeneratedFiles, type Message } from "@/lib/chat-types";

const HISTORY_KEYS = ["scriptHistory", "script_factory_history"];
const USAGE_KEY = "generationCount";

function readFilesAsAttachments(files: FileList): Promise<Attachment[]> {
  return Promise.all(
    Array.from(files).map(
      (file) =>
        new Promise<Attachment>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ name: file.name, content: (reader.result as string) ?? "" });
          reader.onerror = () => resolve({ name: file.name, content: "" });
          reader.readAsText(file);
        })
    )
  );
}

function bumpUsageCount(): number {
  try {
    const next = (parseInt(localStorage.getItem(USAGE_KEY) ?? "0", 10) || 0) + 1;
    localStorage.setItem(USAGE_KEY, String(next));
    return next;
  } catch {
    return 0;
  }
}

export function GeneratorPanel({ chatId }: { chatId: string }) {
  const { toast, showToast } = useToast();
  const workspace = useLocalWorkspace(showToast);

  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [framework, setFramework] = useState<"esx" | "qbcore">("esx");
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedFiles | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<Attachment[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [usageCount, setUsageCount] = useState(0);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load this chat's messages (or a draft prompt handed off from the Prompt Generator)
  useEffect(() => {
    try {
      setUsageCount(parseInt(localStorage.getItem(USAGE_KEY) ?? "0", 10) || 0);
    } catch {
      // ignore
    }

    if (!chatId) return;
    try {
      const raw = localStorage.getItem(HISTORY_KEYS[0]) || localStorage.getItem(HISTORY_KEYS[1]);
      const list = raw ? JSON.parse(raw) : [];
      const current = list.find((item: any) => item.id === chatId);
      if (current) {
        setMessages(current.messages || []);
        if (current.framework) setFramework(current.framework);
        if (current.language) setLanguage(current.language);
        const lastWithResult = [...(current.messages || [])].reverse().find((m: Message) => m.result);
        setResult(lastWithResult?.result ?? null);
      } else {
        setMessages([]);
        setResult(null);
      }
    } catch {
      setMessages([]);
      setResult(null);
    }

    const draft = sessionStorage.getItem("draftPrompt");
    if (draft) {
      setPrompt(draft);
      sessionStorage.removeItem("draftPrompt");
    }
  }, [chatId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function mergeAttachments(incoming: Attachment[]) {
    setAttachedFiles((prev) => {
      const filtered = prev.filter((f) => !incoming.some((n) => n.name === f.name));
      return [...filtered, ...incoming];
    });
    if (incoming.length > 0) showToast(`Attached ${incoming.length} file(s).`, "success");
  }

  async function handleUploadFiles(files: FileList) {
    mergeAttachments(await readFilesAsAttachments(files));
  }

  async function handleOpenFolder() {
    const attachments = await workspace.openFolder();
    if (attachments.length > 0) mergeAttachments(attachments);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files?.length) handleUploadFiles(e.dataTransfer.files);
  }

  function removeAttachedFile(name: string) {
    setAttachedFiles((prev) => prev.filter((f) => f.name !== name));
  }

  function saveChatToHistory(updatedMessages: Message[], fw: string, lang: string) {
    try {
      const raw = localStorage.getItem(HISTORY_KEYS[0]) || localStorage.getItem(HISTORY_KEYS[1]);
      const list = raw ? JSON.parse(raw) : [];
      const firstUserMsg = updatedMessages.find((m) => m.role === "user")?.content || "Untitled Script";
      const title = firstUserMsg.slice(0, 40) + (firstUserMsg.length > 40 ? "…" : "");
      const entry = {
        id: chatId,
        title,
        scriptName: title,
        messages: updatedMessages,
        framework: fw,
        language: lang,
        timestamp: Date.now(),
      };
      const idx = list.findIndex((item: any) => item.id === chatId);
      if (idx >= 0) list[idx] = entry;
      else list.unshift(entry);
      const trimmed = list.slice(0, 20);
      HISTORY_KEYS.forEach((key) => localStorage.setItem(key, JSON.stringify(trimmed)));
      window.dispatchEvent(new Event("storage"));
    } catch {
      // localStorage unavailable — chat still works, just won't persist
    }
  }

  function readSkillsAsInstructions(): string {
    try {
      const skillsRaw = localStorage.getItem("script-factory-skills");
      if (skillsRaw) {
        const list = JSON.parse(skillsRaw);
        if (Array.isArray(list) && list.length > 0) {
          return list.map((s) => `--- Skill: ${s.name} ---\n${s.content}`).join("\n\n");
        }
      }
      return localStorage.getItem("customInstructions") ?? "";
    } catch {
      return "";
    }
  }

  async function handleSend() {
    if ((!prompt.trim() && attachedFiles.length === 0) || loading) return;

    let promptToSend = prompt || "Please analyze the attached file(s).";
    if (attachedFiles.length > 0) {
      promptToSend += "\n\n--- Attached files (full content) ---\n";
      attachedFiles.forEach((f) => {
        promptToSend += `\nFile: ${f.name}\n\`\`\`\n${f.content}\n\`\`\`\n`;
      });
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt || `Analyze: ${attachedFiles.map((f) => f.name).join(", ")}`,
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setPrompt("");
    setAttachedFiles([]);
    setLoading(true);
    setError(null);
    saveChatToHistory(newMessages, framework, language);

    try {
      const customInstructions = readSkillsAsInstructions();
      const apiMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.role === "user" ? m.content : JSON.stringify(m.result) })),
        { role: "user", content: promptToSend },
      ];

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, framework, language, customInstructions }),
      });
      if (!res.ok) throw new Error("Generation failed. Try rephrasing the request.");
      const data: GeneratedFiles = await res.json();
      setResult(data);

      if (data.supported !== false) setUsageCount(bumpUsageCount());

      const modelMsg: Message = {
        id: crypto.randomUUID(),
        role: "model",
        content: data.explanation || "Done.",
        result: data,
      };
      const updatedMessages = [...newMessages, modelMsg];
      setMessages(updatedMessages);
      saveChatToHistory(updatedMessages, framework, language);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(key: string, content: string) {
    navigator.clipboard.writeText(content);
    setCopiedKey(key);
    showToast(`Copied ${FILE_LABELS[key as FileKey] ?? key}.`, "success");
    setTimeout(() => setCopiedKey(null), 2000);
  }

  async function handleSaveToDisk(key: FileKey) {
    if (!result?.[key]) return;
    await workspace.saveToDisk(FILE_LABELS[key], result[key] as string);
  }

  async function handleDownloadZip() {
    if (!result) return;
    const zip = new JSZip();
    (Object.keys(FILE_LABELS) as FileKey[]).forEach((key) => {
      if (result[key]) zip.file(FILE_LABELS[key], result[key] as string);
    });
    const fxmanifest = `-- Generated by Script Factory
fx_version 'cerulean'
game 'gta5'

${result.client_lua ? "client_script 'client.lua'\n" : ""}${result.server_lua ? "server_script 'server.lua'\n" : ""}${result.config_lua ? "shared_script 'config.lua'\n" : ""}`;
    zip.file("fxmanifest.lua", fxmanifest);

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated_script.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Downloaded generated_script.zip", "success");
  }

  return (
    <div className="grid h-full gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
      {/* Chat column */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        className={`relative flex h-full flex-col overflow-hidden rounded-lg border bg-surface transition-colors ${
          isDraggingOver ? "border-accent" : "border-border"
        }`}
      >
        {isDraggingOver && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center gap-2 bg-background/90 font-mono text-sm text-accent">
            <Sparkles className="h-4 w-4" /> Drop files to attach
          </div>
        )}

        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-surface-2 p-3">
          <div className="flex gap-2">
            <Select value={framework} onValueChange={(v) => setFramework(v as "esx" | "qbcore")}>
              <SelectTrigger className="h-8 w-[92px] font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="esx">ESX</SelectItem>
                <SelectItem value="qbcore">QBCore</SelectItem>
              </SelectContent>
            </Select>
            <Select value={language} onValueChange={(v) => setLanguage(v as "en" | "ar")}>
              <SelectTrigger className="h-8 w-[92px] font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Badge
            variant="outline"
            className="hidden shrink-0 font-mono text-[10px] sm:inline-flex"
            title="Local device count — not an enforced quota yet"
          >
            {usageCount} generated on this device
          </Badge>
        </div>

        {workspace.localFiles.length > 0 && (
          <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-border bg-surface-2/50 px-3 py-2">
            <span className="shrink-0 font-mono text-[11px] text-muted-foreground">Workspace:</span>
            {workspace.localFiles.map((f) => (
              <Button
                key={f.name}
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const att = await workspace.readFile(f.handle);
                  if (att) mergeAttachments([att]);
                }}
                className="h-6 shrink-0 gap-1 border border-border/50 bg-surface px-2 font-mono text-xs hover:bg-surface-2"
              >
                {f.name}
              </Button>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="min-h-[240px] flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
              <Sparkles className="mb-3 h-8 w-8 opacity-60" />
              <p className="text-sm">Start a conversation to build or analyze your script.</p>
              <p className="mt-1 text-xs opacity-70">Or try one of these:</p>
              <StarterPrompts onPick={setPrompt} />
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} language={language} onViewResult={() => setResult(msg.result!)} />
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-lg rounded-tl-sm border border-border bg-surface-2 p-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking…
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-border bg-surface p-3">
          {error && <p className="mb-2 px-1 text-xs text-destructive">{error}</p>}
          <AttachmentChips files={attachedFiles} onRemove={removeAttachedFile} />

          <div className="flex items-end gap-2">
            <AttachMenu onUploadFiles={handleUploadFiles} onOpenFolder={handleOpenFolder} workspaceSupported={workspace.supported} />
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Describe a script, or ask about the attached files…"
              className="max-h-[160px] min-h-[42px] resize-none px-3 py-2 text-sm"
              dir={language === "ar" ? "rtl" : "ltr"}
            />
            <Button
              onClick={handleSend}
              disabled={loading || (!prompt.trim() && attachedFiles.length === 0)}
              className="h-[42px] shrink-0 rounded-lg px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Output column */}
      <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface">
        <OutputPanel
          result={result}
          copiedKey={copiedKey}
          savingFileKey={workspace.savingFileKey}
          onCopy={handleCopy}
          onSaveToDisk={handleSaveToDisk}
          onDownloadZip={handleDownloadZip}
        />
      </div>

      <Toast toast={toast} />
    </div>
  );
}
