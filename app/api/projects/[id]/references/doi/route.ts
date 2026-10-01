import { NextResponse } from "next/server";
import { z } from "zod";

import { elapsedMs, logOperationalEvent, logSanitizedOperationalFailure, startRequest } from "@/lib/observability/request-context";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { authorizeProjectRoute } from "@/modules/projects/auth";
import { DoiLookupError, lookupDoi, readBoundedJson } from "@/modules/research-workflow/doi-lookup";

export const maxDuration = 15;
const inputSchema = z.object({ doi: z.string().trim().min(1).max(300) });
const headers = { "Cache-Control": "private, no-store" };

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Projeto inválido." }, { status: 400, headers });
  const access = await authorizeProjectRoute({ projectId: id, request, mutation: true });
  if (!access.ok) return access.response;
  const rate = checkRateLimit(`doi-lookup:${access.value.userId}`, 20, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Muitas buscas. Aguarde um minuto ou preencha os campos manualmente." }, { status: 429, headers: { ...headers, "Retry-After": String(rate.retryAfterSeconds) } });
  }
  const parsed = inputSchema.safeParse(await readBoundedJson(request, 1024).catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Informe um DOI válido ou preencha os campos manualmente." }, { status: 400, headers });
  const requestContext = startRequest(request);
  try {
    const result = await lookupDoi(parsed.data.doi);
    logOperationalEvent("doi_lookup_completed", requestContext, { durationMs: elapsedMs(requestContext), status: "success" });
    return NextResponse.json(result, { headers });
  } catch (error) {
    const code = error instanceof DoiLookupError ? error.code : "doi_unavailable";
    if (code === "doi_unavailable") logSanitizedOperationalFailure("doi_lookup_failed", requestContext, error, { durationMs: elapsedMs(requestContext) });
    const status = code === "invalid_doi" ? 400 : code === "doi_not_found" ? 404 : 503;
    const message = code === "invalid_doi" ? "Confira o DOI informado. Você também pode preencher os campos manualmente."
      : code === "doi_not_found" ? "DOI não encontrado nas bases consultadas. Confira o DOI ou preencha os campos manualmente."
        : "A busca está indisponível no momento. Tente novamente ou preencha os campos manualmente.";
    return NextResponse.json({ error: message }, { status, headers });
  }
}
