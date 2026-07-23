import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createDocxExport } from "@/modules/export/docx";
import { buildExportFilename } from "@/modules/export/filename";
import { createPdfExport } from "@/modules/export/pdf";
import { loadGenerationSnapshot } from "@/modules/generation/storage";

export const maxDuration = 30;
export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, context: { params: Promise<{ format: string; id: string }> }) {
  const { format, id } = await context.params;
  if (!UUID.test(id) || (format !== "docx" && format !== "pdf")) return NextResponse.json({ error: "Exportação inválida." }, { status: 400 });

  const supabase = await createClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (authError || typeof userId !== "string") return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });

  const { data: project } = await supabase
    .from("projects")
    .select("title, theme, problem_statement, keywords, knowledge_area, academic_level")
    .eq("id", id)
    .eq("owner_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });

  const snapshot = await loadGenerationSnapshot(supabase, userId, id);
  if (!snapshot.structure || !snapshot.revision) return NextResponse.json({ error: "Salve uma estrutura antes de exportar." }, { status: 409 });

  const input = { exportedAt: new Date(), project, references: snapshot.references, revision: snapshot.revision, structure: snapshot.structure };
  const file = format === "docx" ? await createDocxExport(input) : await createPdfExport(input);
  const filename = buildExportFilename(project.title, format);

  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(file.byteLength),
      "Content-Type": format === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/pdf",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
