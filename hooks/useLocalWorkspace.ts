"use client";

import { useState } from "react";
import type { ToastTone } from "@/hooks/useToast";

export type Attachment = { name: string; content: string };
export type WorkspaceFile = { name: string; handle: any };

export function useLocalWorkspace(onToast: (message: string, tone?: ToastTone) => void) {
  const [dirHandle, setDirHandle] = useState<any>(null);
  const [localFiles, setLocalFiles] = useState<WorkspaceFile[]>([]);
  const [savingFileKey, setSavingFileKey] = useState<string | null>(null);

  const supported = typeof window !== "undefined" && "showDirectoryPicker" in window;

  async function openFolder(): Promise<Attachment[]> {
    if (!supported) {
      onToast("Your browser doesn't support opening local folders — try Chrome or Edge.", "error");
      return [];
    }
    try {
      // @ts-ignore — File System Access API, Chromium-only
      const handle = await window.showDirectoryPicker();
      setDirHandle(handle);

      const files: WorkspaceFile[] = [];
      const attachments: Attachment[] = [];

      for await (const entry of handle.values()) {
        if (entry.kind === "file") {
          files.push({ name: entry.name, handle: entry });
          if (/\.(lua|sql|html|js)$/i.test(entry.name)) {
            try {
              const file = await entry.getFile();
              attachments.push({ name: entry.name, content: await file.text() });
            } catch {
              // unreadable file, skip it
            }
          }
        }
      }
      setLocalFiles(files);
      onToast(`Linked folder — found ${files.length} file(s).`, "success");
      return attachments;
    } catch (err: any) {
      if (err?.name !== "AbortError") onToast("Couldn't open that folder.", "error");
      return [];
    }
  }

  async function readFile(handle: any): Promise<Attachment | null> {
    try {
      const file = await handle.getFile();
      return { name: file.name, content: await file.text() };
    } catch {
      onToast(`Couldn't read ${handle.name}.`, "error");
      return null;
    }
  }

  async function saveToDisk(fileName: string, content: string) {
    let handle = dirHandle;
    if (!handle) {
      if (!supported) {
        onToast("Your browser doesn't support saving to a local folder — try Chrome or Edge.", "error");
        return;
      }
      try {
        // @ts-ignore
        handle = await window.showDirectoryPicker();
        setDirHandle(handle);
      } catch (err: any) {
        if (err?.name !== "AbortError") onToast("Couldn't open a folder to save to.", "error");
        return;
      }
    }

    try {
      setSavingFileKey(fileName);
      const fileHandle = await handle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      setLocalFiles((prev) => (prev.some((f) => f.name === fileName) ? prev : [...prev, { name: fileName, handle: fileHandle }]));
      onToast(`Saved ${fileName} to your folder.`, "success");
    } catch (err: any) {
      if (err?.name !== "AbortError") onToast(`Couldn't save ${fileName} — check folder permissions.`, "error");
    } finally {
      setSavingFileKey(null);
    }
  }

  return { supported, dirHandle, localFiles, savingFileKey, openFolder, readFile, saveToDisk };
}
