"use client";

import { useCallback, useState } from "react";

export type ToastTone = "success" | "error" | "info";
export type ToastState = { id: number; message: string; tone: ToastTone } | null;

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = useCallback((message: string, tone: ToastTone = "info") => {
    const id = Date.now();
    setToast({ id, message, tone });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3200);
  }, []);

  return { toast, showToast };
}
