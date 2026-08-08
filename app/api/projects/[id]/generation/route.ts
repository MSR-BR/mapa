import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/modules/projects/auth";
import { editableResearchStructureSchema, validateReferenceIds } from "@/modules/generation/schema";
import { loadGenerationSnapshot, loadGenerationStatus } from "@/modules/generation/storage";
import { toJson } from "@/modules/generation/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Projeto inválido." }, { status: 400 });
  const { supabase, userId } = await requireAuthenticatedUser();
  const statusOnly = new URL(request.url).searchParams.get("status") === "1";
  const payload = statusOnly
    ? { job: await loadGenerationStatus(supabase, userId, id) }
    : await loadGenerationSnapshot(supabase, userId, id);
  return NextResponse.json(payload, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Projeto inválido." }, { status: 400 });
  const { supabase, userId } = await requireAuthenticatedUser();
  const body: unknown = await request.json().catch(() => null);
  const parsed = editableResearchStructureSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "A estrutura contém campos inválidos." }, { status: 400 });

  const { data: stored } = await supabase
    .from("research_structures")
    .select("references_data, revision")
    .eq("project_id", id)
    .eq("owner_id", userId)
    .maybeSingle();
  if (!stored) return NextResponse.json({ error: "Gere uma estrutura antes de editar." }, { status: 404 });

  const allowed = new Set(
    (Array.isArray(stored.references_data) ? stored.references_data : [])
      .map((reference) => reference && typeof reference === "object" && "referenceId" in reference ? reference.referenceId : null)
      .filter((value): value is string => typeof value === "string"),
  );
  if (validateReferenceIds(parsed.data, allowed).length > 0) {
    return NextResponse.json({ error: "A edição contém referências não verificadas." }, { status: 400 });
  }

  const { error } = await supabase
    .from("research_structures")
    .update({ content: toJson(parsed.data), revision: stored.revision + 1, updated_at: new Date().toISOString() })
    .eq("project_id", id)
    .eq("owner_id", userId);
  if (error) return NextResponse.json({ error: "Não foi possível salvar a estrutura." }, { status: 500 });
  return NextResponse.json({ ok: true, revision: stored.revision + 1 });
}
