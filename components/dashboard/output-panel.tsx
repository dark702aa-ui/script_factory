"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, Download, Eye, Loader2, Save, ShieldCheck, ShieldAlert, Terminal } from "lucide-react";
import type { FileKey, GeneratedFiles } from "@/lib/chat-types";
import { FILE_LABELS } from "@/lib/chat-types";

export function OutputPanel({
  result,
  copiedKey,
  savingFileKey,
  onCopy,
  onSaveToDisk,
  onDownloadZip,
}: {
  result: GeneratedFiles | null;
  copiedKey: string | null;
  savingFileKey: string | null;
  onCopy: (key: string, content: string) => void;
  onSaveToDisk: (key: FileKey) => void;
  onDownloadZip: () => void;
}) {
  const fileKeys = (Object.keys(FILE_LABELS) as FileKey[]).filter((k) => result?.[k]);

  if (!result) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center text-muted-foreground">
        <Terminal className="mb-2 h-8 w-8 opacity-50" />
        <p className="font-mono text-sm">Workspace empty</p>
        <p className="text-sm">Generated code will appear here.</p>
      </div>
    );
  }

  if (result.supported === false) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center text-muted-foreground">
        <Badge variant="outline" className="mb-2">
          out of scope
        </Badge>
        <p className="max-w-sm text-sm text-foreground">{result.explanation}</p>
      </div>
    );
  }

  const criticalCount = result.sanitizerFindings?.filter((f) => f.severity === "critical").length ?? 0;
  const warningCount = result.sanitizerFindings?.filter((f) => f.severity === "warning").length ?? 0;
  const findingsTitle = result.sanitizerFindings?.map((f) => `${f.severity}: ${f.message}`).join("\n");

  const defaultTab = fileKeys[0];

  return (
    <Tabs defaultValue={defaultTab} className="flex h-full flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-2 px-3 py-1.5">
        <div className="flex flex-wrap items-center">
          <TabsList className="h-auto flex-wrap bg-transparent p-0">
            {fileKeys.map((key) => (
              <TabsTrigger
                key={key}
                value={key}
                className="rounded-none border-b-2 border-transparent px-3 py-2.5 font-mono text-xs data-[state=active]:border-accent data-[state=active]:bg-transparent"
              >
                {FILE_LABELS[key]}
              </TabsTrigger>
            ))}
            {result.nui_html && (
              <TabsTrigger
                value="preview"
                className="flex items-center gap-1 rounded-none border-b-2 border-transparent px-3 py-2.5 font-mono text-xs data-[state=active]:border-accent data-[state=active]:bg-transparent"
              >
                <Eye className="h-3 w-3" /> preview
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <div className="flex items-center gap-2">
          <span
            title={findingsTitle}
            className={`hidden items-center gap-1 rounded-md border px-2 py-1 font-mono text-[10px] sm:flex ${
              criticalCount > 0
                ? "border-destructive/40 text-destructive"
                : warningCount > 0
                  ? "border-border text-muted-foreground"
                  : "border-code/30 text-code"
            }`}
          >
            {criticalCount > 0 ? <ShieldAlert className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
            {criticalCount > 0
              ? `${criticalCount} blocked`
              : warningCount > 0
                ? `${warningCount} flagged`
                : "sanitized"}
          </span>
          {result._meta && (
            <Badge variant="outline" className="hidden font-mono text-[10px] sm:inline-flex">
              {result._meta.model}
            </Badge>
          )}
          <Button onClick={onDownloadZip} variant="ghost" size="sm" className="gap-1.5 font-mono text-xs">
            <Download className="h-3.5 w-3.5" />
            .zip
          </Button>
        </div>
      </div>

      {fileKeys.map((key) => (
        <TabsContent key={key} value={key} className="relative mt-0 h-full flex-1 overflow-hidden">
          <div className="absolute end-4 top-3 z-10 flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 border-border bg-surface/80 px-2 text-xs opacity-90 backdrop-blur-sm hover:opacity-100"
              onClick={() => onSaveToDisk(key)}
            >
              {savingFileKey === FILE_LABELS[key] ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 border-border bg-surface/80 px-2 text-xs opacity-90 backdrop-blur-sm hover:opacity-100"
              onClick={() => onCopy(key, result[key] as string)}
            >
              {copiedKey === key ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copiedKey === key ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="h-full overflow-auto">
            <pre className="w-full min-w-max px-5 py-4 pt-14 font-mono text-[13px] leading-relaxed text-foreground/90">
              {result[key]}
            </pre>
          </div>
        </TabsContent>
      ))}

      {result.nui_html && (
        <TabsContent value="preview" className="mt-0 h-full flex-1 overflow-hidden bg-white">
          <iframe
            srcDoc={result.nui_html}
            sandbox="allow-scripts"
            title="NUI preview"
            className="h-full w-full border-0"
          />
        </TabsContent>
      )}
    </Tabs>
  );
}
