/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { BASE_SYSTEM_PROMPT } from "@/lib/prompts";
import { sanitizeLuaScript, SanitizerFinding } from "@/lib/sanitizer/luaSanitizer";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { Groq } from "groq-sdk";

export const runtime = "nodejs";

type GeneratedFiles = {
  supported?: boolean;
  client_lua?: string;
  server_lua?: string;
  config_lua?: string;
  install_sql?: string;
  nui_html?: string;
  explanation?: string;
};

const CODE_KEYS = ["client_lua", "server_lua"] as const;

// إعداد المفاتيح المتعددة (تدعم GROQ_API_KEYS مفصولة بفواصل، أو GROQ_API_KEY_SCRIPT،
// أو التراجع إلى GROQ_API_KEY العادي حتى يشتغل مهما كان اسم المتغير في .env.local)
const apiKeys = (
  process.env.GROQ_API_KEYS
    ? process.env.GROQ_API_KEYS.split(",").map(k => k.trim())
    : [process.env.GROQ_API_KEY_SCRIPT || process.env.GROQ_API_KEY]
).filter(Boolean) as string[];

let currentKeyIndex = 0;

/**
 * دالة مساعدة لتنفيذ طلبات Groq مع نظام التبديل التلقائي عند حدوث Rate Limit (429)
 */
async function executeWithGroqKeyRotation<T>(fn: (groq: Groq) => Promise<T>): Promise<T> {
  if (apiKeys.length === 0) {
    throw new Error("No Groq API keys are configured in .env.local (GROQ_API_KEYS or GROQ_API_KEY_SCRIPT)");
  }

  let attempts = 0;
  const maxAttempts = apiKeys.length;

  while (attempts < maxAttempts) {
    const apiKey = apiKeys[currentKeyIndex];
    // الانتقال للمفتاح التالي بالدور (Round-robin) للطلبات القادمة
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;

    const groq = new Groq({ apiKey });

    try {
      return await fn(groq);
    } catch (err: any) {
      const status = err?.status || err?.statusCode;
      const message = err?.message || "";
      const isRateLimit = status === 429 || message.includes("rate_limit_exceeded") || message.includes("Rate limit");

      // إذا كان الخطأ بسبب تجاوز الحد وهناك مفاتيح أخرى، جرب المفتاح التالي
      if (isRateLimit && attempts < maxAttempts - 1) {
        console.warn(`Groq API key rate limited, switching to next key... (Attempt ${attempts + 1}/${maxAttempts})`);
        attempts++;
        continue;
      }
      // لأي خطأ آخر أو نفاد المفاتيح، أوقف التكرار وأرجع الخطأ
      throw err;
    }
  }
  throw new Error("All Groq API keys have reached their rate limits.");
}

// TODO(auth): there is no real authentication yet — every visitor is treated
// as the same "demo-user". Before a public launch, replace this with a real
// session (e.g. NextAuth.js) so quota/history are tied to an actual account
// instead of the shared IP-based rate limit below.
async function getSession(req: NextRequest): Promise<{ userId: string } | null> {
  return { userId: "demo-user" };
}

async function checkAndConsumeQuota(userId: string): Promise<{ allowed: boolean }> {
  return { allowed: true };
}

function sanitizeResult(result: GeneratedFiles): { findings: SanitizerFinding[]; blocked: boolean } {
  const findings: SanitizerFinding[] = [];
  let blocked = false;

  for (const key of CODE_KEYS) {
    const code = result[key];
    if (!code) continue;
    const { findings: fileFindings, safe } = sanitizeLuaScript(code, key);
    findings.push(...fileFindings);
    if (!safe) blocked = true;
  }

  return { findings, blocked };
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // No real auth exists yet (see TODO above), so throttle by IP to stop a
  // single visitor/bot from draining the shared Groq API quota.
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(`generate:${ip}`, { limit: 10, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please wait ${rateLimit.retryAfterSeconds}s and try again.` },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const body = await req.json().catch(() => null);
  const { messages, framework, language, customInstructions } = body ?? {};

  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    !["esx", "qbcore"].includes(framework) ||
    !["en", "ar"].includes(language)
  ) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Guard against pathological payloads (huge attachments, giant chat
  // history) inflating token cost per request.
  const MAX_MESSAGE_CHARS = 40_000;
  const totalChars = messages.reduce((sum: number, m: any) => sum + String(m?.content ?? "").length, 0);
  if (totalChars > MAX_MESSAGE_CHARS) {
    return NextResponse.json(
      { error: "Conversation/context is too large. Remove some attached files or start a new chat." },
      { status: 413 }
    );
  }

  const quota = await checkAndConsumeQuota(session.userId);
  if (!quota.allowed) {
    return NextResponse.json({ error: "Generation quota exceeded for your plan." }, { status: 429 });
  }

  const fullSystemPrompt = `${BASE_SYSTEM_PROMPT}\n\nFRAMEWORK: ${framework}\nFRAMEWORK CONVENTIONS:\n${
    framework === "esx"
      ? "- ESX: use ESX.GetPlayerFromId, TriggerEvent('esx:...'), exports for shared functions, ESX.RegisterUsableItem for items, esx_society for shared accounts."
      : "- QBCore: use QBCore.Functions.GetPlayer, TriggerEvent('QBCore:...'), QBCore.Functions.CreateCallback for client↔server request/response, exports['qb-inventory'] for item handling."
  }\n${
    customInstructions?.trim()
      ? `PROJECT-SPECIFIC INSTRUCTIONS:\n${customInstructions.trim()}\n`
      : ""
  }\nCAPABILITIES: You can either GENERATE new FiveM scripts from scratch OR ANALYZE, REVIEW, DEBUG, and EXPLAIN existing code/files provided by the user. If the user asks a question about a script, asks for a code review, or wants to know what a script does, analyze the provided code thoroughly and explain it in the "explanation" field (and optionally provide corrected code if fixing bugs). Set "supported": true for any valid FiveM related request (generation or code review/analysis). Only set "supported": false if the request is completely unrelated to FiveM or game development. Include a config.lua with any tunable values when generating new scripts. If the script needs a database table, include install_sql.`;

  const groqMessages = [
    { role: "system", content: fullSystemPrompt },
    ...messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    })),
  ];

  let result: GeneratedFiles;
  try {
    // استدعاء Groq مع دعم التبديل التلقائي للمفاتيح
    const completion = await executeWithGroqKeyRotation(async (groq) => {
      return await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: groqMessages,
        temperature: 0.2,
        response_format: { type: "json_object" },
        max_tokens: 8000,
      });
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) {
      throw new Error("No output returned from Groq model.");
    }

    result = JSON.parse(text) as GeneratedFiles;
  } catch (err: any) {
    console.error("=================== SCRIPT GENERATION ERROR ===================");
    console.error(err);
    console.error("==============================================================");
    return NextResponse.json(
      { error: err?.message || "Generation failed." },
      { status: 502 }
    );
  }

  if (result.supported === false) {
    return NextResponse.json({
      supported: false,
      explanation:
        result.explanation ||
        "This tool only works with FiveM ESX/QBCore scripts — try describing or providing script code instead.",
    });
  }

  const firstSanitize = sanitizeResult(result);
  let findings = firstSanitize.findings;
  const blocked = firstSanitize.blocked;

  if (blocked) {
    try {
      const repairMessages = [
        ...groqMessages,
        { role: "assistant", content: JSON.stringify(result) },
        {
          role: "user",
          content: `Your previous output failed automated safety checks. Fix ONLY the issues listed below, preserving everything else about the script's structure and behavior. Return the full corrected JSON object in the same format as before.\n\nSAFETY FINDINGS TO FIX:\n${findings.map((f) => `- [${f.file}${f.line ? `:${f.line}` : ""}] ${f.rule}: ${f.message}`).join("\n")}`
        }
      ];

      // استدعاء الإصلاح أيضاً مع نظام التبديل التلقائي للمفاتيح
      const repairCompletion = await executeWithGroqKeyRotation(async (groq) => {
        return await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: repairMessages,
          temperature: 0.2,
          response_format: { type: "json_object" },
          max_tokens: 8000,
        });
      });

      result = JSON.parse(repairCompletion.choices[0]?.message?.content || "{}") as GeneratedFiles;
    } catch (err) {
      console.error("Repair Error:", err);
      return NextResponse.json(
        { error: "Sanitizer blocked unsafe output and the repair attempt failed.", findings },
        { status: 502 }
      );
    }

    const second = sanitizeResult(result);
    findings = second.findings;
    if (second.blocked) {
      return NextResponse.json(
        {
          error: "Generated code failed safety checks twice. Try rephrasing your request.",
          findings,
        },
        { status: 422 }
      );
    }
  }

  return NextResponse.json({
    ...result,
    supported: true,
    sanitizerFindings: findings,
    _meta: { provider: "groq", model: "llama-3.3-70b-versatile" },
  });
}