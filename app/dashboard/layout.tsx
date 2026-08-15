"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FilePlus2,
  History as HistoryIcon,
  Sparkles,
  Terminal,
  Wand2,
  Plus,
  Code2,
  Trash2,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Script Maker (Chat)", icon: FilePlus2 },
  { href: "/dashboard/prompt-generator", label: "Prompt Generator", icon: Wand2 },
  { href: "/dashboard/history", label: "History", icon: HistoryIcon },
  { href: "/dashboard/skills", label: "Skills & Instructions", icon: Sparkles },
];

type HistoryItem = {
  id: string;
  title?: string;
  scriptName?: string;
  timestamp?: number;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const loadHistory = () => {
    const saved = localStorage.getItem("scriptHistory") || localStorage.getItem("script_factory_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  };

  useEffect(() => {
    loadHistory();
    window.addEventListener("storage", loadHistory);
    return () => window.removeEventListener("storage", loadHistory);
  }, []);

  const handleNewChat = () => {
    const newId = Date.now().toString();
    router.push(`/dashboard?chat=${newId}`);
  };

  const handleDeleteHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    localStorage.setItem("scriptHistory", JSON.stringify(updated));
    localStorage.setItem("script_factory_history", JSON.stringify(updated));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0d0e12] text-white dir-ltr">
      {/* Gemini-Style Sidebar */}
      <aside className="flex w-64 flex-col border-r border-gray-800/80 bg-[#121319] shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2 border-b border-gray-800/80 px-5 py-4">
          <Terminal className="h-5 w-5 text-[#e85527]" />
          <span className="font-display text-base font-bold tracking-wide">Script Factory</span>
        </div>

        {/* Action Button */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e85527] px-4 py-2.5 text-sm font-medium text-white shadow-lg transition hover:bg-[#d4481c] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 px-3 py-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#1c1e27] text-white"
                    : "text-gray-400 hover:bg-[#161820] hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 text-gray-400" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Saved Chats / History List */}
        <div className="flex-1 overflow-hidden px-3 pt-4 flex flex-col">
          <div className="mb-2 flex items-center justify-between px-2 text-xs font-semibold uppercase text-gray-400">
            <span>Recent Scripts</span>
            <span className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px] font-mono text-gray-300">
              {history.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-800">
            {history.length === 0 ? (
              <p className="py-6 text-center text-xs text-gray-500">No saved chats yet</p>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => router.push(`/dashboard?chat=${item.id}`)}
                  className="group flex items-center justify-between rounded-lg p-2 text-xs text-gray-400 transition hover:bg-[#181a24] hover:text-white cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Code2 className="h-3.5 w-3.5 shrink-0 text-[#e85527]" />
                    <span className="truncate">{item.title || item.scriptName || "Untitled Script"}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteHistory(e, item.id)}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition p-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-gray-800/80 p-3">
          <div className="rounded-lg bg-[#161820] border border-gray-800 px-3 py-2 text-center text-xs font-mono text-gray-400">
            Gemini 2.5 Engine · Active
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 h-full overflow-hidden bg-[#0d0e12]">
        {children}
      </main>
    </div>
  );
}