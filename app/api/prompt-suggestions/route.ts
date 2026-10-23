import { createClient } from "@/lib/supabase/server";
import { AiError, aiErrorStatus } from "@/modules/ai/failure";
import { withAiProgress } from "@/modules/ai/route";
import { NextResponse } from "next/server";

import {
  logSanitizedOperationalFailure,
  startRequest,
} from "@/lib/observability/request-context";
import { suggestResearchPrompts } from "@/modules/generation/gemini";
import { checkRateLimit, getAuthenticatedClientKey } from "@/lib/security/rate-limit";

export const maxDuration = 30;

async function handlePost(request: Request) {
  const requestContext = startRequest(request);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || typeof data?.claims?.sub !== "string" || data.claims.is_anonymous === true) {
    return NextResponse.json({ code: "authentication_required", error: "Entre no Mapa com sua conta Google para receber sugestões de IA. Você pode continuar escrevendo sua ideia." }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
  }
  // Students in one classroom share a public IP; verified account identity is
  // the abuse-control boundary for this authenticated, optional operation.
  const rate = checkRateLimit(getAuthenticatedClientKey("prompt-suggestions", data.claims.sub), 15, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Muitas solicitações. Tente novamente em instantes." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }
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
    logSanitizedOperationalFailure("prompt_suggestions_failed", requestContext, error, {
      queryLength: prompt.length,
    });
    return NextResponse.json(
      { code: error instanceof AiError ? error.code : "suggestions_unavailable", error: error instanceof AiError ? error.message : "Não foi possível preparar sugestões agora. Você pode continuar escrevendo sua ideia." },
      { status: error instanceof AiError ? aiErrorStatus(error) : 502, headers: { "Cache-Control": "private, no-store", ...(error instanceof AiError && error.retryAfterSeconds ? { "Retry-After": String(error.retryAfterSeconds) } : {}) } },
    );
  }
}

export const POST = withAiProgress(handlePost, 25_000);
