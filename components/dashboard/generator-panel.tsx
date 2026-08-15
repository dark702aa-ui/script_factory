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
import { Download, Loader2, Sparkles, Copy, Check, Paperclip, Send, Terminal, FolderOpen, Save, FileCode, X } from "lucide-react";
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

export function GeneratorPanel({ chatId }: { chatId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [framework, setFramework] = useState<"esx" | "qbcore">("esx");
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedFiles | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // نظام الملفات المرفقة تلقائياً أو يدوياً
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; content: string }[]>([]);

  // Local Workspace States (File System Access API)
  const [dirHandle, setDirHandle] = useState<any>(null);
  const [localFiles, setLocalFiles] = useState<{ name: string; handle: any }[]>([]);
  const [savingFileKey, setSavingFileKey] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId) return;

    try {
      const raw = localStorage.getItem("scriptHistory") || localStorage.getItem("script_factory_history");
      if (raw) {
        const list = JSON.parse(raw);
        const currentChat = list.find((item: any) => item.id === chatId);
        
        if (currentChat) {
          setMessages(currentChat.messages || []);
          if (currentChat.framework) setFramework(currentChat.framework);
          if (currentChat.language) setLanguage(currentChat.language);
          
          const lastModelMsgWithResult = currentChat.messages?.slice().reverse().find((m: Message) => m.result);
          if (lastModelMsgWithResult?.result) {
            setResult(lastModelMsgWithResult.result);
          } else {
            setResult(null);
          }
        } else {
          setMessages([]);
          setResult(null);
        }
      } else {
        setMessages([]);
        setResult(null);
      }
    } catch (e) {
      console.error("Failed to load chat", e);
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
  }, [messages]);

  // فتح المجلد وقراءة جميع ملفات السكريبت الموجودة فيه تلقائياً وإرفاقها فوراً
  async function handleOpenFolder() {
    try {
      if (!window.showDirectoryPicker) {
        alert("Your browser does not support the File System Access API. Please use Chrome or Edge.");
        return;
      }
      // @ts-ignore
      const handle = await window.showDirectoryPicker();
      setDirHandle(handle);
      
      const files: { name: string; handle: any }[] = [];
      const newAttached: { name: string; content: string }[] = [];

      for await (const entry of handle.values()) {
        if (entry.kind === 'file') {
          files.push({ name: entry.name, handle: entry });
          // قراءة الملفات البرمجية تلقائياً وإضافتها للمرفقات
          if (entry.name.endsWith('.lua') || entry.name.endsWith('.sql') || entry.name.endsWith('.html') || entry.name.endsWith('.js')) {
            try {
              const file = await entry.getFile();
              const text = await file.text();
              newAttached.push({ name: entry.name, content: text });
            } catch (err) {
              console.error("Failed to read file:", entry.name);
            }
          }
        }
      }
      setLocalFiles(files);
      if (newAttached.length > 0) {
        setAttachedFiles(newAttached);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Folder picker failed", err);
      }
    }
  }

  // قراءة ملف محلي فردي عند الضغط عليه من الشريط
  async function handleReadLocalFile(fileHandle: any) {
    try {
      const file = await fileHandle.getFile();
      const text = await file.text();
      setAttachedFiles(prev => {
        const filtered = prev.filter(f => f.name !== file.name);
        return [...filtered, { name: file.name, content: text }];
      });
    } catch (err) {
      console.error("Failed to read local file", err);
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
          setAttachedFiles(prev => {
            const filtered = prev.filter(f => f.name !== file.name);
            return [...filtered, { name: file.name, content: text }];
          });
        }
      };
      reader.readAsText(file);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  function removeAttachedFile(fileName: string) {
    setAttachedFiles(prev => prev.filter(f => f.name !== fileName));
  }

  async function handleSaveToLocalDisk(key: Exclude<keyof GeneratedFiles, "supported" | "explanation">) {
    if (!result || !result[key]) return;
    const fileName = FILE_LABELS[key];
    const content = result[key]!;

    if (!dirHandle) {
      await handleOpenFolder();
    }

    if (!dirHandle) return;

    try {
      setSavingFileKey(key);
      // @ts-ignore
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
      // @ts-ignore
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      
      if (!localFiles.some(f => f.name === fileName)) {
        setLocalFiles(prev => [...prev, { name: fileName, handle: fileHandle }]);
      }
      
      alert(`Successfully saved ${fileName} to your local folder!`);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Failed to write to local disk", err);
        alert("Permission denied or failed to save file.");
      }
    } finally {
      setSavingFileKey(null);
    }
  }

  function saveChatToHistory(updatedMessages: Message[], currentFramework: string, currentLanguage: string) {
    try {
      const raw = localStorage.getItem("scriptHistory") || localStorage.getItem("script_factory_history");
      let list = raw ? JSON.parse(raw) : [];
      
      const firstUserMsg = updatedMessages.find(m => m.role === "user")?.content || "Untitled Script";
      const title = firstUserMsg.slice(0, 40) + (firstUserMsg.length > 40 ? "..." : "");

      const existingIndex = list.findIndex((item: any) => item.id === chatId);
      const chatEntry = {
        id: chatId,
        title,
        scriptName: title,
        messages: updatedMessages,
        framework: currentFramework,
        language: currentLanguage,
        timestamp: Date.now(),
      };

      if (existingIndex >= 0) {
        list[existingIndex] = chatEntry;
      } else {
        list.unshift(chatEntry);
      }

      localStorage.setItem("scriptHistory", JSON.stringify(list.slice(0, 20)));
      localStorage.setItem("script_factory_history", JSON.stringify(list.slice(0, 20)));
      window.dispatchEvent(new Event("storage"));
    } catch {
      // localStorage unavailable
    }
  }

  async function handleSend() {
    if ((!prompt.trim() && attachedFiles.length === 0) || loading) return;
    
    let promptToSend = prompt;
    
    // إرسال محتوى جميع الملفات المرفقة بالكامل مع الرسالة للذكاء الاصطناعي
    if (attachedFiles.length > 0) {
      promptToSend += "\n\n--- User Attached Script Files (Full Content) ---\n";
      attachedFiles.forEach(f => {
        promptToSend += `\nFile Name: ${f.name}\n\`\`\`lua\n${f.content}\n\`\`\`\n`;
      });
    } else if (result) {
      const activeKeys = fileKeys;
      if (activeKeys.length > 0) {
        promptToSend += "\n\n--- Current Generated Files Context ---\n";
        activeKeys.forEach(k => {
          if (result[k]) {
            promptToSend += `\nFile: ${FILE_LABELS[k]}\n\`\`\`lua\n${result[k]}\n\`\`\`\n`;
          }
        });
      }
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: prompt || "Analyze these files" };
    const newMessages = [...messages, userMsg];
    
    setMessages(newMessages);
    setPrompt("");
    setLoading(true);
    setError(null);
    
    saveChatToHistory(newMessages, framework, language);

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
          customInstructions = localStorage.getItem("customInstructions") ?? "";
        }
      } catch (e) {
        console.error("Failed to parse skills", e);
      }
      
      const apiMessages = [...newMessages.slice(0, -1), { role: "user", content: promptToSend }];
      const formattedApiMessages = apiMessages.map(m => ({
        role: m.role,
        content: m.role === "user" ? m.content : JSON.stringify(m.result)
      }));

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: formattedApiMessages, framework, language, customInstructions }),
      });
      
      if (!res.ok) throw new Error("Generation failed. Try rephrasing the request.");
      
      const data: GeneratedFiles = await res.json();
      setResult(data);
      
      const modelMsg: Message = {
        id: crypto.randomUUID(),
        role: "model",
        content: data.explanation || "Analyzed successfully.",
        result: data,
      };
      
      const updatedMessages = [...newMessages, modelMsg];
      setMessages(updatedMessages);

      if (data.supported !== false) {
        saveChatToHistory(updatedMessages, framework, language);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

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

    const fxmanifest = `-- Generated by Script Factory\nfx_version 'cerulean'\ngame 'gta5'\n\n${result.client_lua ? "client_script 'client.lua'\n" : ""}${result.server_lua ? "server_script 'server.lua'\n" : ""}${result.config_lua ? "shared_script 'config.lua'\n" : ""}`;
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
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenFolder}
              className="h-8 gap-1.5 font-mono text-xs bg-surface"
            >
              <FolderOpen className="h-3.5 w-3.5 text-accent" />
              {dirHandle ? "Folder Linked" : "Open Folder"}
            </Button>
            <Badge variant="outline" className="font-mono text-xs hidden sm:inline-flex">
              /workspace
            </Badge>
          </div>
        </div>
        
        {localFiles.length > 0 && (
          <div className="bg-surface-2/50 border-b border-border px-4 py-2 flex items-center gap-2 overflow-x-auto shrink-0">
            <span className="text-[11px] font-mono text-muted-foreground shrink-0">Workspace Files:</span>
            {localFiles.map((f) => (
              <Button
                key={f.name}
                variant="ghost"
                size="sm"
                onClick={() => handleReadLocalFile(f.handle)}
                className="h-6 px-2 text-xs font-mono gap-1 shrink-0 bg-surface border border-border/50 hover:bg-surface-2"
              >
                <FileCode className="h-3 w-3 text-muted-foreground" />
                {f.name}
              </Button>
            ))}
          </div>
        )}
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground opacity-70">
              <Sparkles className="h-8 w-8 mb-3" />
              <p className="text-sm">Start a conversation to build or analyze your script.</p>
              <p className="text-xs mt-1">Open a folder and all files will be automatically attached for the AI.</p>
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
                Reading files & analyzing code...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-border shrink-0 bg-surface">
          {error && <p className="text-xs text-destructive mb-2 px-1">{error}</p>}
          
          {/* عرض الملفات المرفقة بشكل بارز وواضح */}
          {attachedFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2 bg-surface-2/80 p-2 rounded-md border border-border">
              <span className="text-xs font-mono text-muted-foreground w-full">Attached for AI review (Full Content Sent):</span>
              {attachedFiles.map((file) => (
                <div key={file.name} className="flex items-center gap-1.5 bg-surface px-2.5 py-1 rounded border border-border text-xs font-mono">
                  <FileCode className="h-3.5 w-3.5 text-accent" />
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <button 
                    onClick={() => removeAttachedFile(file.name)}
                    className="text-muted-foreground hover:text-destructive ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

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
              placeholder="Ask about the attached script or request modifications..."
              className="min-h-[42px] max-h-[160px] resize-none py-2 px-3 text-sm"
              dir={language === "ar" ? "rtl" : "ltr"}
            />
            
            <Button
              onClick={handleSend}
              disabled={loading || (!prompt.trim() && attachedFiles.length === 0)}
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
              <div className="flex items-center gap-2 ml-2">
                <Button 
                  onClick={() => handleSaveToLocalDisk(fileKeys[0] as any)} 
                  variant="outline" 
                  size="sm" 
                  className="gap-1.5 font-mono text-xs shrink-0 bg-accent text-accent-foreground hover:bg-accent/90 border-transparent"
                >
                  {savingFileKey === fileKeys[0] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save to Disk
                </Button>
                <Button onClick={handleDownloadZip} variant="ghost" size="sm" className="gap-1.5 font-mono text-xs shrink-0">
                  <Download className="h-3.5 w-3.5" />
                  .zip
                </Button>
              </div>
            </div>
            
            {fileKeys.map((key) => (
              <TabsContent key={key} value={key} className="mt-0 flex-1 relative h-full overflow-hidden">
                <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-7 gap-1 px-2 text-xs opacity-80 hover:opacity-100 transition-opacity bg-surface/80 backdrop-blur-sm border-border"
                    onClick={() => handleSaveToLocalDisk(key as any)}
                  >
                    <Save className="h-3 w-3" />
                    Save Local
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-7 gap-1 px-2 text-xs opacity-80 hover:opacity-100 transition-opacity bg-surface/80 backdrop-blur-sm border-border"
                    onClick={() => handleCopy(key, result[key]!)}
                  >
                    {copiedKey === key ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copiedKey === key ? "Copied" : "Copy"}
                  </Button>
                </div>
                <div className="h-full overflow-auto">
                  <pre className="px-5 py-4 pt-14 lg:pt-4 lg:pr-36 font-mono text-[13px] leading-relaxed text-foreground/90 w-full min-w-max">
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