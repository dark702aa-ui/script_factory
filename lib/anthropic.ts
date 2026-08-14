import Anthropic from "@anthropic-ai/sdk";

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is not set.");
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const MODELS = {
  generate: "claude-sonnet-5",
  debug: "claude-haiku-4-5-20251001",
  optimize: "claude-sonnet-5",
  convert: "claude-sonnet-5",
  conflictCheck: "claude-haiku-4-5-20251001",
} as const;
