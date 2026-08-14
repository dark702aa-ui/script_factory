import { NextRequest, NextResponse } from "next/server";
import { BASE_SYSTEM_PROMPT, buildGeneratePrompt, buildRepairPrompt } from "@/lib/prompts";
import { sanitizeLuaScript, SanitizerFinding } from "@/lib/sanitizer/luaSanitizer";

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
async function getSession(req: NextRequest): Promise<{ userId: string } | null> {
  return { userId: "demo-user" };
}

async function checkAndConsumeQuota(userId: string): Promise<{ allowed: boolean }> {
  return { allowed: true };
}

async function callModel(systemPrompt: string, userPrompt: string): Promise<GeneratedFiles> {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  // Verification: confirms in your `npm run dev` terminal, on every generation,
  // which provider ran and how long the system prompt actually was — so you can
  // see it's the full ~4,500-char BASE_SYSTEM_PROMPT, not an empty/short string.
  console.log(
    `[generate] provider=${groqKey ? "groq" : geminiKey ? "gemini" : "none"} systemPromptChars=${systemPrompt.length} userPromptChars=${userPrompt.length}`
  );

  // 1. التوليد عبر Groq API إذا كان مفتاحه متوفر
  if (groqKey) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        // Without an explicit cap, multi-feature scripts (e.g. "a full laptop
        // with contacts, messages, settings") can get truncated mid-JSON.
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Groq API Error: ${err?.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    return JSON.parse(text) as GeneratedFiles;
  }

  // 2. التوليد عبر Gemini API إذا كان المفتاح صحيحاً ويبدأ بـ AIzaSy
  if (geminiKey) {
    if (!geminiKey.startsWith("AIzaSy")) {
      throw new Error("مفتاح Gemini غير صحيح. مفاتيح Google AI Studio يجب أن تبدأ بـ AIzaSy");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: "application/json", maxOutputTokens: 8000 },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Gemini API Error: ${err?.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const cleanedText = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    return JSON.parse(cleanedText) as GeneratedFiles;
  }

  throw new Error("لم يتم العثور على مفتاح API في .env.local (يرجى إضافة GROQ_API_KEY أو GEMINI_API_KEY)");
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
  const { prompt, framework, language, customInstructions } = body ?? {};

  if (
    typeof prompt !== "string" ||
    !prompt.trim() ||
    !["esx", "qbcore"].includes(framework) ||
    !["en", "ar"].includes(language)
  ) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const quota = await checkAndConsumeQuota(session.userId);
  if (!quota.allowed) {
    return NextResponse.json({ error: "Generation quota exceeded for your plan." }, { status: 429 });
  }

  let result: GeneratedFiles;
  try {
    result = await callModel(
      BASE_SYSTEM_PROMPT,
      buildGeneratePrompt({
        prompt,
        framework,
        language,
        customInstructions: typeof customInstructions === "string" ? customInstructions : undefined,
      })
    );
  } catch (err: any) {
    console.error("=================== GENERATION ERROR ===================");
    console.error(err);
    console.error("=======================================================");
    return NextResponse.json(
      { error: err?.message || "Generation failed." },
      { status: 502 }
    );
  }

  // The model itself decides whether the request is in scope (see the SCOPE
  // rule in lib/prompts.ts). When it isn't, there's no code to sanitize —
  // just pass the polite refusal straight through to the client.
  if (result.supported === false) {
    return NextResponse.json({
      supported: false,
      explanation:
        result.explanation ||
        "This tool only generates FiveM ESX/QBCore scripts — try describing a script instead.",
    });
  }

  let { findings, blocked } = sanitizeResult(result);

  if (blocked) {
    try {
      result = await callModel(
        BASE_SYSTEM_PROMPT,
        buildRepairPrompt({ previous: result, findings, framework, language })
      );
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
