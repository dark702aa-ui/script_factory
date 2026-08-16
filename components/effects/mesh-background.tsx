export function MeshBackground({ grid = true }: { grid?: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="sf-glow-blob sf-glow-blob--accent" style={{ top: "-8%", left: "8%" }} />
      <div
        className="sf-glow-blob sf-glow-blob--code"
        style={{ top: "15%", right: "2%", animationDelay: "-6s, -2s" }}
      />
      <div
        className="sf-glow-blob sf-glow-blob--blue"
        style={{ bottom: "-18%", left: "28%", animationDelay: "-11s, -4s" }}
      />
      {grid && <div className="sf-mesh-grid" />}
    </div>
  );
}
