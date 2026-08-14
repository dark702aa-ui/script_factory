"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FilePlus2, History, Sparkles, Terminal, Wand2 } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Script Maker (Chat)", icon: FilePlus2 },
  { href: "/dashboard/prompt-generator", label: "Prompt Generator", icon: Wand2 },
  { href: "/dashboard/history", label: "History", icon: History },
  { href: "/dashboard/skills", label: "Skills & Instructions", icon: Sparkles },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-60 flex-col border-e border-border bg-surface">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Terminal className="h-4 w-4 text-accent" />
          <span className="font-display text-base font-semibold">Script Factory</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-surface-2 text-foreground"
                    : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-4">
          <span className="block w-full rounded-md border border-border px-2.5 py-1.5 text-center font-mono text-xs text-muted-foreground">
            Monthly plan · 214/500 used
          </span>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
