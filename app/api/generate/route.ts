/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { BASE_SYSTEM_PROMPT } from "@/lib/prompts";
import { sanitizeLuaScript, SanitizerFinding } from "@/lib/sanitizer/luaSanitizer";
import { GoogleGenAI } from "@google/genai";

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

// تخطي فحص تسجيل الدخول للتطوير
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getSession(req: NextRequest): Promise<{ userId: string } | null> {
  return { userId: "demo-user" };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const quota = await checkAndConsumeQuota(session.userId);
  if (!quota.allowed) {
    return NextResponse.json({ error: "Generation quota exceeded for your plan." }, { status: 429 });
  }

  // Build a complete system prompt including framework conventions and custom instructions
  const fullSystemPrompt = `${BASE_SYSTEM_PROMPT}\n\nFRAMEWORK: ${framework}\nFRAMEWORK CONVENTIONS:\n${
    framework === "esx"
      ? "- ESX: use ESX.GetPlayerFromId, TriggerEvent('esx:...'), exports for shared functions, ESX.RegisterUsableItem for items, esx_society for shared accounts."
      : "- QBCore: use QBCore.Functions.GetPlayer, TriggerEvent('QBCore:...'), QBCore.Functions.CreateCallback for client↔server request/response, exports['qb-inventory'] for item handling."
  }\n${
    customInstructions?.trim()
      ? `PROJECT-SPECIFIC INSTRUCTIONS:\n${customInstructions.trim()}\n`
      : ""
  }\nIf the request is in scope, generate the minimum set of files needed to fulfill it. Include a config.lua with any tunable values (prices, cooldowns, locations) rather than hardcoding them in client/server logic. If the script needs a database table, include install_sql.`;

  // Map messages to Gemini format
  const contents = messages.map((m: any) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  let result: GeneratedFiles;
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      throw new Error("لم يتم العثور على مفتاح API في .env.local (يرجى إضافة GEMINI_API_KEY)");
    }

    const ai = new GoogleGenAI({ apiKey: geminiKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: fullSystemPrompt,
        responseMimeType: "application/json",
        temperature: 0.2,
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("لم يتم إرجاع أي نص من النموذج.");
    }
    
    result = JSON.parse(text) as GeneratedFiles;
  } catch (err: any) {
    console.error("=================== GENERATION ERROR ===================");
    console.error(err);
    console.error("=======================================================");
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
        "This tool only generates FiveM ESX/QBCore scripts — try describing a script instead.",
    });
  }

  const firstSanitize = sanitizeResult(result);
  let findings = firstSanitize.findings;
  const blocked = firstSanitize.blocked;

  if (blocked) {
    try {
      // Fix attempt
      const repairContents = [...contents, {
        role: "model",
        parts: [{ text: JSON.stringify(result) }]
      }, {
        role: "user",
        parts: [{ text: `Your previous output failed automated safety checks. Fix ONLY the issues listed below, preserving everything else about the script's structure and behavior. Return the full corrected JSON object in the same format as before.\n\nSAFETY FINDINGS TO FIX:\n${findings.map((f) => `- [${f.file}${f.line ? `:${f.line}` : ""}] ${f.rule}: ${f.message}`).join("\n")}` }]
      }];

      const geminiKey = process.env.GEMINI_API_KEY!;
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      
      const repairResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: repairContents,
        config: {
          systemInstruction: fullSystemPrompt,
          responseMimeType: "application/json",
          temperature: 0.2,
        }
      });
      result = JSON.parse(repairResponse.text!) as GeneratedFiles;
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

  return NextResponse.json({ ...result, supported: true, sanitizerFindings: findings });
}
