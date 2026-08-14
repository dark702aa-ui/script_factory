type Tone = "keyword" | "string" | "comment" | "default";

type EditorFile = {
  name: string;
  lines: { text: string; tone?: Tone }[];
};

const toneClass: Record<Tone, string> = {
  keyword: "text-code",
  string: "text-accent",
  comment: "text-muted-foreground",
  default: "text-foreground/90",
};

export function EditorWindow({
  files,
  activeFile = 0,
}: {
  files: EditorFile[];
  activeFile?: number;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-2xl shadow-black/40">
      <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
        </div>
        <div className="ml-3 flex gap-1 font-mono text-xs">
          {files.map((f, i) => (
            <span
              key={f.name}
              className={`-mb-px rounded-t px-3 py-1 ${
                i === activeFile
                  ? "border-x border-t border-border bg-surface text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {f.name}
            </span>
          ))}
        </div>
      </div>
      <pre className="overflow-x-auto px-5 py-4 font-mono text-[13px] leading-relaxed">
        {files[activeFile]?.lines.map((line, i) => (
          <div key={i} className={toneClass[line.tone ?? "default"]}>
            {line.text || "\u00A0"}
          </div>
        ))}
      </pre>
    </div>
  );
}
