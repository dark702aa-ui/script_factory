"use client";

import { useState, useRef, useEffect } from "react";
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
import { Download, Loader2, Sparkles, Copy, Check, Paperclip, Send, Terminal } from "lucide-react";
import JSZip from "jszip";

type GeneratedFiles = {
  supported?: boolean;
  client_lua?: string;
  server_lua?: string;
  config_lua?: string;
  install_sql?: string;
  nui_html?: string;
  explanation?: string;
};

const FILE_LABELS: Record<Exclude<keyof GeneratedFiles, "supported">, string> = {
  client_lua: "client.lua",
  server_lua: "server.lua",
  config_lua: "config.lua",
  install_sql: "install.sql",
  nui_html: "index.html",
  explanation: "Explanation",
};

export type Message = {
  id: string;
  role: "user" | "model";
  content: string;
  result?: GeneratedFiles;
};

function pushToHistory(entry: { title: string; messages: Message[]; framework: string; language: string }) {
  try {
    const raw = localStorage.getItem("scriptHistory");
    const list = raw ? JSON.parse(raw) : [];
    list.unshift({ id: crypto.randomUUID(), timestamp: Date.now(), ...entry });
    localStorage.setItem("scriptHistory", JSON.stringify(list.slice(0, 20)));
  } catch {
    // localStorage unavailable
  }
}

export function GeneratorPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [framework, setFramework] = useState<"esx" | "qbcore">("esx");
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedFiles | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const draft = sessionStorage.getItem("draftPrompt");
    if (draft) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrompt(draft);
      sessionStorage.removeItem("draftPrompt");
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!prompt.trim() || loading) return;
    
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: prompt };
    const newMessages = [...messages, userMsg];
    
    setMessages(newMessages);
    setPrompt("");
    setLoading(true);
    setError(null);
    
    try {
      let customInstructions = "";
      try {
        const skillsRaw = localStorage.getItem("script-factory-skills");
        if (skillsRaw) {
          const skillsList = JSON.parse(skillsRaw);
          if (Array.isArray(skillsList)) {
            customInstructions = skillsList.map(s => `--- Skill: ${s.name} ---\n${s.description}\n${s.content}\n`).join("\n");
          }
        } else {
          // Fallback to old format
          customInstructions = localStorage.getItem("customInstructions") ?? "";
        }
      } catch (e) {
        console.error("Failed to parse skills", e);
      }
      
      const apiMessages = newMessages.map(m => ({
        role: m.role,
        content: m.role === "user" ? m.content : JSON.stringify(m.result)
      }));

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, framework, language, customInstructions }),
      });
      
      if (!res.ok) throw new Error("Generation failed. Try rephrasing the request.");
      
      const data: GeneratedFiles = await res.json();
      setResult(data);
      
      const modelMsg: Message = {
        id: crypto.randomUUID(),
        role: "model",
        content: data.explanation || "Script generated successfully.",
        result: data,
      };
      
      const updatedMessages = [...newMessages, modelMsg];
      setMessages(updatedMessages);

      if (data.supported !== false) {
        pushToHistory({ 
          title: newMessages[0].content.slice(0, 40) + (newMessages[0].content.length > 40 ? "..." : ""),
          messages: updatedMessages, 
          framework, 
          language 
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setPrompt(prev => prev + "\\n\\n--- File: " + file.name + " ---\\n```\\n" + text + "\\n```\\n");
        }
      };
      reader.readAsText(file);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCopy = (key: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadZip = async () => {
    if (!result) return;
    const zip = new JSZip();

    fileKeys.forEach((key) => {
      if (result[key]) {
        zip.file(FILE_LABELS[key], result[key]!);
      }
    });

    const fxmanifest = `-- Generated by Script Factory\nfx_version 'cerulean'\ngame 'gta5'\n\n${result.client_lua ? "client_script 'client.lua'\\n" : ""}${result.server_lua ? "server_script 'server.lua'\\n" : ""}${result.config_lua ? "shared_script 'config.lua'\\n" : ""}`;
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
  };

  const fileKeys = (Object.keys(FILE_LABELS) as (Exclude<keyof GeneratedFiles, "supported">)[]).filter(
    (k) => k !== "explanation" && result?.[k]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr] h-[calc(100vh-140px)]">
      {/* Chat Column */}
      <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface h-[calc(100vh-140px)]">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface-2 shrink-0">
          <div className="flex gap-2">
            <Select value={framework} onValueChange={(v) => setFramework(v as "esx" | "qbcore")}>
              <SelectTrigger className="font-mono text-xs w-[100px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="esx">ESX</SelectItem>
                <SelectItem value="qbcore">QBCore</SelectItem>
              </SelectContent>
            </Select>
            <Select value={language} onValueChange={(v) => setLanguage(v as "en" | "ar")}>
              <SelectTrigger className="font-mono text-xs w-[100px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Badge variant="outline" className="font-mono text-xs hidden sm:inline-flex">
            /chat
          </Badge>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground opacity-70">
              <Sparkles className="h-8 w-8 mb-3" />
              <p className="text-sm">Start a conversation to build your script.</p>
              <p className="text-xs mt-1">You can upload existing code for debugging too.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 text-sm ${
                    msg.role === "user"
                      ? "bg-accent text-accent-foreground rounded-tr-sm"
                      : "bg-surface-2 text-foreground rounded-tl-sm border border-border"
                  }`}
                  dir={msg.role === "user" && language === "ar" ? "rtl" : "ltr"}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  
                  {msg.result && msg.result.supported !== false && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 w-full bg-surface/50 border-border/50 text-xs gap-2"
                      onClick={() => setResult(msg.result!)}
                    >
                      <Terminal className="h-3 w-3" />
                      View generated files
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-surface-2 text-muted-foreground rounded-lg p-3 rounded-tl-sm border border-border text-sm flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-border shrink-0 bg-surface">
          {error && <p className="text-xs text-destructive mb-2 px-1">{error}</p>}
          <div className="relative flex items-end gap-2">
            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              size="icon"
              className="h-[42px] w-[42px] shrink-0 rounded-lg"
              onClick={() => fileInputRef.current?.click()}
              title="Attach code file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message Script Factory..."
              className="min-h-[42px] max-h-[160px] resize-none py-2 px-3 text-sm"
              dir={language === "ar" ? "rtl" : "ltr"}
            />
            
            <Button
              onClick={handleSend}
              disabled={loading || !prompt.trim()}
              className="h-[42px] px-4 shrink-0 rounded-lg"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Output column */}
      <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface h-[calc(100vh-140px)]">
        {!result ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center text-muted-foreground">
            <Terminal className="h-8 w-8 mb-2 opacity-50" />
            <p className="font-mono text-sm">Workspace empty</p>
            <p className="text-sm">Generated code will appear here.</p>
          </div>
        ) : result.supported === false ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center text-muted-foreground">
            <Badge variant="outline" className="mb-2">out of scope</Badge>
            <p className="max-w-sm text-sm text-foreground">{result.explanation}</p>
          </div>
        ) : (
          <Tabs defaultValue={fileKeys[0]} className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border bg-surface-2 px-3 shrink-0">
              <TabsList className="h-auto bg-transparent p-0 flex-wrap">
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
              <Button onClick={handleDownloadZip} variant="ghost" size="sm" className="gap-1.5 font-mono text-xs shrink-0 ml-2">
                <Download className="h-3.5 w-3.5" />
                Download .zip
              </Button>
            </div>
            
            {fileKeys.map((key) => (
              <TabsContent key={key} value={key} className="mt-0 flex-1 relative h-full overflow-hidden">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="absolute right-4 top-4 z-10 h-7 gap-1.5 px-2 text-xs opacity-70 hover:opacity-100 transition-opacity bg-surface/80 backdrop-blur-sm"
                  onClick={() => handleCopy(key, result[key]!)}
                >
                  {copiedKey === key ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedKey === key ? "Copied" : "Copy"}
                </Button>
                <div className="h-full overflow-auto">
                  <pre className="px-5 py-4 pt-14 lg:pt-4 lg:pr-24 font-mono text-[13px] leading-relaxed text-foreground/90 w-full min-w-max">
                    {result[key]}
                  </pre>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}