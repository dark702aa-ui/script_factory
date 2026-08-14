import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are a Prompt Engineer for a FiveM Script Generator AI. 
Your job is to take the user's rough idea for a FiveM script (ESX/QBCore) and turn it into a highly detailed, structured, and professional prompt that will produce the best possible code from the Script Generator.

Follow this structure for the enhanced prompt:
1. **Script Overview**: A clear 1-2 sentence description.
2. **Core Features**: A bulleted list of the exact mechanics.
3. **Configuration Requirements**: What should go in config.lua (coords, prices, times).
4. **UI/NUI (if applicable)**: Describe the frontend look and feel.
5. **Database**: Mention if it needs SQL tables.

Output ONLY the enhanced prompt text. Do not include introductory text like "Here is your prompt:".`;

export async function POST(req: NextRequest) {
  try {
    const { idea } = await req.json();
    if (!idea) return NextResponse.json({ error: "Idea is required" }, { status: 400 });

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: idea,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
      }
    });

    const prompt = response.text?.trim() || "";
    return NextResponse.json({ prompt });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to generate prompt" }, { status: 500 });
  }
}