import { NextResponse } from "next/server";

import { suggestResearchPrompts } from "@/modules/generation/gemini";

export const maxDuration = 30;

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const prompt = body && typeof body === "object" && "prompt" in body
    ? String(body.prompt).trim()
    : "";

  if (prompt.length < 18 || prompt.length > 5_000) {
    return NextResponse.json(
      { error: "Escreva um pouco mais para receber sugestões." },
      { status: 400 },
    );
  }

  try {
    const suggestions = await suggestResearchPrompts(prompt);
    return NextResponse.json(
      { suggestions },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("prompt_suggestions_failed", {
      message: error instanceof Error ? error.message : "unknown-error",
      promptLength: prompt.length,
    });
    return NextResponse.json(
      { error: "Não foi possível preparar sugestões agora." },
      { status: 502 },
    );
  }
}
