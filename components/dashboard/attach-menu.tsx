"use client";

import { useEffect, useRef, useState } from "react";
import { FileCode, FolderOpen, Paperclip, Upload, X } from "lucide-react";
import type { Attachment } from "@/hooks/useLocalWorkspace";

const EXT_COLOR: Record<string, string> = {
  lua: "text-accent",
  sql: "text-code",
  html: "text-blue-400",
  js: "text-yellow-400",
};

function extOf(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function AttachMenu({
  onUploadFiles,
  onOpenFolder,
  workspaceSupported,
}: {
  onUploadFiles: (files: FileList) => void;
  onOpenFolder: () => void;
  workspaceSupported: boolean;
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onUploadFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Attach files"
        className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        <Paperclip className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute bottom-full start-0 mb-2 w-56 overflow-hidden rounded-lg border border-border bg-surface-2 shadow-xl">
          <button
            type="button"
            onClick={() => {
              inputRef.current?.click();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-start text-sm text-foreground hover:bg-surface"
          >
            <Upload className="h-4 w-4 text-muted-foreground" />
            Upload files
          </button>
          {workspaceSupported && (
            <button
              type="button"
              onClick={() => {
                onOpenFolder();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 border-t border-border px-3 py-2.5 text-start text-sm text-foreground hover:bg-surface"
            >
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              Open workspace folder
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function AttachmentChips({
  files,
  onRemove,
}: {
  files: Attachment[];
  onRemove: (name: string) => void;
}) {
  if (files.length === 0) return null;
  return (
    <div className="mb-2 flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-surface-2/80 p-2">
      <span className="w-full font-mono text-[11px] text-muted-foreground">
        Attached — full content sent with your next message:
      </span>
      {files.map((file) => (
        <div
          key={file.name}
          className="flex items-center gap-1.5 rounded border border-border bg-surface px-2.5 py-1 font-mono text-xs"
        >
          <FileCode className={`h-3.5 w-3.5 ${EXT_COLOR[extOf(file.name)] ?? "text-muted-foreground"}`} />
          <span className="max-w-[150px] truncate">{file.name}</span>
          <button onClick={() => onRemove(file.name)} className="ms-1 text-muted-foreground hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
