import React from "react";

export function Badge({
  children,
  className = "",
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "secondary";
}) {
  const styles =
    variant === "outline"
      ? "border border-border bg-transparent text-muted-foreground"
      : variant === "secondary"
      ? "border-transparent bg-surface-2 text-foreground"
      : "border border-border bg-surface text-foreground";

  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-0.5 font-mono text-xs font-medium ${styles} ${className}`}
    >
      {children}
    </span>
  );
}
