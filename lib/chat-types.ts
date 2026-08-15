export type GeneratedFiles = {
  supported?: boolean;
  client_lua?: string;
  server_lua?: string;
  config_lua?: string;
  install_sql?: string;
  nui_html?: string;
  explanation?: string;
  sanitizerFindings?: { rule: string; severity: "critical" | "warning"; message: string; file: string; line: number | null }[];
  _meta?: { provider: string; model: string };
};

export type Message = {
  id: string;
  role: "user" | "model";
  content: string;
  result?: GeneratedFiles;
};

export type FileKey = "client_lua" | "server_lua" | "config_lua" | "install_sql" | "nui_html";

export const FILE_LABELS: Record<FileKey, string> = {
  client_lua: "client.lua",
  server_lua: "server.lua",
  config_lua: "config.lua",
  install_sql: "install.sql",
  nui_html: "nui/index.html",
};
