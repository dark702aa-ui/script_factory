type EditorFile = {
  name: string;
  content: string;
  language?: string;
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
      <pre className="overflow-x-auto px-5 py-4 font-mono text-[13px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
        {files[activeFile]?.content || ""}
      </pre>
    </div>
  );
}
