import { parse } from "luaparse";

export type Severity = "critical" | "warning";

export type SanitizerFinding = {
  rule: string;
  severity: Severity;
  message: string;
  line: number | null;
  file: string;
};

type WalkVisitor = (node: any, parents: any[]) => void;

function walk(node: any, visitor: WalkVisitor, parents: any[] = []): void {
  if (!node || typeof node !== "object") return;
  if (node.type) visitor(node, parents);

  const nextParents = node.type ? [...parents, node] : parents;

  for (const key of Object.keys(node)) {
    if (key === "type" || key === "range" || key === "loc") continue;
    const value = node[key];
    if (Array.isArray(value)) {
      value.forEach((child) => walk(child, visitor, nextParents));
    } else if (value && typeof value === "object") {
      walk(value, visitor, nextParents);
    }
  }
}

function resolveCalleeName(base: any): string | null {
  if (!base) return null;
  if (base.type === "Identifier") return base.name;
  if (base.type === "MemberExpression") return base.identifier?.name ?? null;
  return null;
}

function containsConcatenation(node: any): boolean {
  if (!node || typeof node !== "object") return false;
  if (node.type === "BinaryExpression" && node.operator === "..") return true;
  return Object.values(node).some((v) =>
    Array.isArray(v) ? v.some(containsConcatenation) : containsConcatenation(v)
  );
}

const DANGEROUS_CALLS = new Set(["execute", "popen", "loadstring", "dofile", "load"]);
const SQL_FUNCTIONS = new Set(["query", "execute", "fetchAll", "fetchScalar", "insert", "update", "single"]);
const ECONOMY_FUNCTIONS = new Set(["addMoney", "AddMoney", "addAccountMoney", "removeMoney"]);

function checkDangerousCalls(node: any, findings: SanitizerFinding[], file: string) {
  if (node.type !== "CallExpression") return;
  const name = resolveCalleeName(node.base);
  if (name && DANGEROUS_CALLS.has(name)) {
    findings.push({
      rule: "dangerous_call",
      severity: "critical",
      message: `Use of "${name}" is disallowed — arbitrary code execution risk.`,
      line: node.loc?.start.line ?? null,
      file,
    });
  }
}

function checkSqlConcatenation(node: any, findings: SanitizerFinding[], file: string) {
  if (node.type !== "CallExpression") return;
  const name = resolveCalleeName(node.base);
  if (!name || !SQL_FUNCTIONS.has(name)) return;

  const firstArg = node.arguments?.[0];
  if (firstArg && containsConcatenation(firstArg)) {
    findings.push({
      rule: "sql_concatenation",
      severity: "critical",
      message:
        'SQL query built via string concatenation ("..") — use parameterized placeholders (@param / ?) instead.',
      line: node.loc?.start.line ?? null,
      file,
    });
  }
}

function checkGlobalLeakage(node: any, findings: SanitizerFinding[], file: string) {
  if (node.type !== "AssignmentStatement") return;
  node.variables.forEach((v: any) => {
    if (v.type === "Identifier" && v.isLocal === undefined) {
      findings.push({
        rule: "implicit_global",
        severity: "warning",
        message: `"${v.name}" is assigned without \`local\` — creates a global, risking collisions with other resources.`,
        line: node.loc?.start.line ?? null,
        file,
      });
    }
  });
}

function checkUnvalidatedEconomyCall(node: any, parents: any[], findings: SanitizerFinding[], file: string) {
  if (node.type !== "CallExpression") return;
  const name = resolveCalleeName(node.base);
  if (!name || !ECONOMY_FUNCTIONS.has(name)) return;

  const enclosingFn = [...parents].reverse().find((p) => p.type === "FunctionDeclaration");
  const fnSource = enclosingFn ? JSON.stringify(enclosingFn) : "";
  const looksValidated = /tonumber|math\.min|math\.max|validate|Config\.Max/i.test(fnSource);

  if (!looksValidated) {
    findings.push({
      rule: "unvalidated_economy_call",
      severity: "warning",
      message: `Call to "${name}" found with no nearby validation (tonumber/range clamp) — confirm the amount isn't taken directly from client input.`,
      line: node.loc?.start.line ?? null,
      file,
    });
  }
}

export function sanitizeLuaScript(
  code: string,
  filename = "script.lua"
): { findings: SanitizerFinding[]; safe: boolean } {
  const findings: SanitizerFinding[] = [];
  let ast: any;

  try {
    ast = parse(code, { locations: true, ranges: true });
  } catch (err) {
    return {
      findings: [
        {
          rule: "parse_error",
          severity: "critical",
          message: `Generated code is not valid Lua: ${err instanceof Error ? err.message : String(err)}`,
          line: (err as any)?.line ?? null,
          file: filename,
        },
      ],
      safe: false,
    };
  }

  walk(ast, (node, parents) => {
    checkDangerousCalls(node, findings, filename);
    checkSqlConcatenation(node, findings, filename);
    checkGlobalLeakage(node, findings, filename);
    checkUnvalidatedEconomyCall(node, parents, findings, filename);
  });

  return { findings, safe: !findings.some((f) => f.severity === "critical") };
}
