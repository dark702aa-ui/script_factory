import { CheckCircle2, Info, XCircle } from "lucide-react";
import type { ToastState } from "@/hooks/useToast";

const TONE: Record<string, { icon: typeof CheckCircle2; className: string }> = {
  success: { icon: CheckCircle2, className: "border-code/40 bg-code/10" },
  error: { icon: XCircle, className: "border-destructive/40 bg-destructive/10" },
  info: { icon: Info, className: "border-border bg-surface-2" },
};

export function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;
  const { icon: Icon, className } = TONE[toast.tone];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div
        className={`pointer-events-auto flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm text-foreground shadow-xl backdrop-blur ${className}`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {toast.message}
      </div>
    </div>
  );
}
