import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/modules/projects/auth";
import { fetchResearchStarterReport } from "@/modules/research-starter/client";
import type { ResearchStarterRequest } from "@/modules/research-starter/types";

const LEVELS = new Set(["last-5-years", "last-10-years"]);

export async function POST(request: Request) {
  await requireAuthenticatedUser();

  const input: unknown = await request.json().catch(() => null);
  if (!input || typeof input !== "object") {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const candidate = input as Record<string, unknown>;
  const topic = typeof candidate.topic === "string" ? candidate.topic.trim() : "";
  const interval = typeof candidate.interval === "string" && LEVELS.has(candidate.interval)
    ? candidate.interval as "last-5-years" | "last-10-years"
    : "last-5-years";
  if (!topic || topic.length > 180) {
    return NextResponse.json({ error: "Informe um tema com até 180 caracteres." }, { status: 400 });
  }

  const reportRequest: ResearchStarterRequest = {
    includeMarkdown: candidate.includeMarkdown === true,
    maxReferences: Math.min(Math.max(Number(candidate.maxReferences) || 30, 1), 30),
    maxTopPapers: Math.min(Math.max(Number(candidate.maxTopPapers) || 20, 1), 20),
    publicationInterval: { kind: interval },
    topic,
  };

  try {
    const report = await fetchResearchStarterReport(reportRequest);
    return NextResponse.json(report, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Não foi possível gerar o relatório inicial." }, { status: 502 });
  }
}
