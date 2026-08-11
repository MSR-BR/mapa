import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { buildExportFilename } from "@/modules/export/filename";
import { createFinalMapPdfExport, createPdfExport } from "@/modules/export/pdf";
import { loadGenerationSnapshot } from "@/modules/generation/storage";
import { buildFinalMap } from "@/modules/research-workflow/final-map";
import { loadResearchWorkflow } from "@/modules/research-workflow/storage";

export const maxDuration = 30;
export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request, context: { params: Promise<{ format: string; id: string }> }) {
  const { format, id } = await context.params;
  if (!UUID.test(id) || (format !== "docx" && format !== "pdf")) return NextResponse.json({ error: "Exportação inválida." }, { status: 400 });
  if (format === "docx") return NextResponse.json({ error: "Exportação em Word está temporariamente indisponível. Use PDF." }, { status: 410 });
  const { searchParams } = new URL(request.url);
  const draft = searchParams.get("draft") === "1";

  const supabase = await createClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (authError || typeof userId !== "string") return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });

  const { data: project } = await supabase
    .from("projects")
    .select("title, theme, problem_statement, keywords, knowledge_area, academic_level, workflow_version")
    .eq("id", id)
    .eq("owner_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });

  if (project.workflow_version === 2) {
    const workflow = await loadResearchWorkflow(supabase, userId, id);
    if (!workflow || !["completed", "reviewing_map"].includes(workflow.state)) {
      return NextResponse.json({ error: "O mapa final ainda não está disponível para exportação." }, { status: 409 });
    }
    const finalMap = buildFinalMap(workflow);
    const finalTitle = finalMap.title?.approvedContent?.trim() || finalMap.title?.proposedContent.trim() || project.title;
    const completed = workflow.state === "completed";
    if (!completed && !draft) {
      return NextResponse.json({ error: "Conclua o mapa ou exporte como rascunho identificado." }, { status: 409 });
    }
    const input = { draft: !completed, exportedAt: new Date(), finalMap, project, revision: workflow.revision };
    const file = await createFinalMapPdfExport(input);
    const filename = buildExportFilename(finalTitle, "pdf");

    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(file.byteLength),
        "Content-Type": "application/pdf",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  const snapshot = await loadGenerationSnapshot(supabase, userId, id);
  if (!snapshot.structure || !snapshot.revision) return NextResponse.json({ error: "Salve uma estrutura antes de exportar." }, { status: 409 });

  const input = { exportedAt: new Date(), project, references: snapshot.references, revision: snapshot.revision, structure: snapshot.structure };
  const file = await createPdfExport(input);
  const filename = buildExportFilename(project.title, "pdf");

  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(file.byteLength),
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
