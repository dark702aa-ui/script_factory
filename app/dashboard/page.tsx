import { GeneratorPanel } from "@/components/dashboard/generator-panel";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">New script</h1>
        <p className="text-sm text-muted-foreground">
          Describe the feature in plain language. Pick a framework. Get client.lua,
          server.lua, config.lua, and SQL back.
        </p>
      </div>
      <GeneratorPanel />
    </div>
  );
}