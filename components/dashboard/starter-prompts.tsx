"use client";

const STARTERS = [
  { label: "🏪 Gas station robbery", prompt: "A gas station robbery job with a 3-minute cooldown, police alert at 40% completion, and a shared loot table in the database." },
  { label: "🚗 Car dealership", prompt: "A car dealership where players can browse a vehicle catalog, test drive, and buy on finance with weekly payments." },
  { label: "🏧 ATM system", prompt: "A hackable ATM system: players plant a device, a 60-second minigame starts, and a police alert fires if it fails." },
  { label: "📱 Phone contacts app", prompt: "A NUI phone contacts app: add/edit/delete contacts, call them, synced to the database per player." },
];

export function StarterPrompts({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="mt-4 grid w-full max-w-sm grid-cols-1 gap-1.5 sm:grid-cols-2">
      {STARTERS.map((s) => (
        <button
          key={s.label}
          onClick={() => onPick(s.prompt)}
          className="rounded-md border border-border bg-surface-2/60 px-3 py-2 text-start text-xs text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
