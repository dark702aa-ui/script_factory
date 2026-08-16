import { NextRequest, NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

// هُنا نخبر الذكاء الاصطناعي بدوره للبدء في الكتابة بنفسه
const SYSTEM_PROMPT = `You are an expert FiveM Prompt Engineer. 
Your task is to take the user's raw script idea and generate a completely custom, highly detailed specification prompt for a FiveM AI script generator.

Include:
- Detailed feature breakdown
- Config requirements
- Database tables (if needed)
- NUI / UI details (if applicable)

CRITICAL: Do NOT use rigid pre-made templates. Write a unique, optimized prompt built specifically around the user's idea. Output ONLY the prompt.`;

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`generate-prompt:${ip}`, { limit: 10, windowMs: 60_000 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Please wait ${rateLimit.retryAfterSeconds}s and try again.` },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const { idea } = await req.json();
    if (!idea) return NextResponse.json({ error: "Idea is required" }, { status: 400 });
    if (typeof idea !== "string" || idea.length > 4000) {
      return NextResponse.json({ error: "Idea must be a string under 4000 characters." }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY_PROMPT || process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json({ error: "مفتاح Groq غير موجود في .env.local" }, { status: 500 });
    }

    const groq = new Groq({ apiKey: groqKey });

    // الاتصال الفعلي بالذكاء الاصطناعي
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Create a detailed script generator prompt for this idea: ${idea}` },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    // استخراج نص الـ AI الحقيقي بدون أي إضافات أو نصوص محددة مسبقاً
    const realAiPrompt = completion.choices[0]?.message?.content?.trim();

    if (!realAiPrompt) {
      throw new Error("لم يتم إرجاع نص من الذكاء الاصطناعي");
    }

    return NextResponse.json({
      prompt: realAiPrompt,
      _meta: { provider: "groq", model: "llama-3.3-70b-versatile" },
    });
  } catch (err: any) {
    console.error("PROMPT GENERATION ERROR:", err);
    return NextResponse.json({ error: err?.message || "Failed to generate prompt" }, { status: 500 });
  }
}