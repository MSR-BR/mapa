import { NextResponse } from "next/server";
import { z } from "zod";

import { toJson } from "@/modules/generation/types";
import {
  authorizeProjectRoute,
  type AuthorizedProjectContext,
} from "@/modules/projects/auth";
import {
  discoveryReferenceSchema,
  researchWorkflowContentSchema,
  type DiscoveryReference,
  type ResearchWorkflow,
  type ResearchWorkflowContent,
} from "@/modules/research-workflow/schema";
import { loadResearchWorkflow } from "@/modules/research-workflow/storage";
import { canonicalDoiUrl, doiLookupProvenanceSchema, normalizeDoi, sameReferenceDoi } from "@/modules/research-workflow/doi-reference";

const manualReferenceInputSchema = z.object({
  abstract: z.string().trim().max(5_000).optional(),
  authors: z.string().trim().max(1_200).optional(),
  doi: z.string().trim().max(300).optional(),
  journal: z.string().trim().max(240).optional(),
  title: z.string().trim().min(3).max(500),
  metadataLookup: doiLookupProvenanceSchema.optional(),
  volumeIssuePages: z.string().trim().max(240).optional(),
});

const requestSchema = z.object({
  reference: manualReferenceInputSchema,
  revision: z.number().int().positive(),
});

function nullableText(value: string | undefined) {
  const text = value?.trim();
  return text ? text : null;
}

function splitAuthors(value: string | undefined) {
  return (value ?? "")
    .split(/[;\n]/)
    .map((author) => author.trim())
    .filter(Boolean);
}

function yearFromPublication(value: string | undefined) {
  const match = value?.match(/\b(1[4-9]\d{2}|20\d{2}|21\d{2}|2200)\b/);
  return match ? Number(match[1]) : null;
}

function doiUrl(doi: string | null) {
  if (!doi) return null;
  const normalized = normalizeDoi(doi);
  if (normalized) return canonicalDoiUrl(normalized);
  if (/^https?:\/\//i.test(doi)) {
    try {
      return new URL(doi).toString();
    } catch {
      return null;
    }
  }
  const cleaned = doi.replace(/^doi:\s*/i, "").replace(/\s+/g, "");
  return cleaned ? encodeURI(`https://doi.org/${cleaned}`) : null;
}

function normalizedReferenceKey(reference: DiscoveryReference) {
  const doi = reference.doi ? normalizeDoi(reference.doi) : null;
  if (doi) return `doi:${doi}`;
  return (reference.doi ?? reference.title ?? reference.referenceId)
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function upsertManualReference(
  content: ResearchWorkflowContent,
  reference: DiscoveryReference,
) {
  const nextKey = normalizedReferenceKey(reference);
  const existingIndex = content.referenceArchive.findIndex((item) => normalizedReferenceKey(item) === nextKey);
  const archive = existingIndex >= 0
    ? content.referenceArchive.map((item, index) => index === existingIndex ? { ...reference, referenceId: item.referenceId } : item)
    : [...content.referenceArchive, reference];
  return researchWorkflowContentSchema.parse({
    ...content,
    referenceArchive: archive.slice(-100),
  });
}

async function saveWorkflow(
  workflow: ResearchWorkflow,
  content: ResearchWorkflowContent,
  supabase: AuthorizedProjectContext["supabase"],
  ownerId: string,
) {
  const revision = workflow.revision + 1;
  const updatedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("research_workflows")
    .update({
      content: toJson(content),
      revision,
      updated_at: updatedAt,
    })
    .eq("project_id", workflow.projectId)
    .eq("owner_id", ownerId)
    .eq("revision", workflow.revision)
    .select("updated_at")
    .maybeSingle();
  if (error || !data) return null;
  return { ...workflow, content, revision, updatedAt: data.updated_at };
}

export async function POST(request: Request, routeContext: { params: Promise<{ id: string }> }) {
  const { id } = await routeContext.params;
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!/^[0-9a-f-]{36}$/i.test(id) || !parsed.success) {
    return NextResponse.json({ error: "Referência inválida." }, { status: 400 });
  }

  const access = await authorizeProjectRoute({ mutation: true, projectId: id, request });
  if (!access.ok) return access.response;
  const { supabase, userId } = access.value;
  const workflow = await loadResearchWorkflow(supabase, userId, id);
  if (!workflow || workflow.revision !== parsed.data.revision) {
    return NextResponse.json({ error: "O mapa foi alterado em outra aba. Recarregue para continuar." }, { status: 409 });
  }

  const input = parsed.data.reference;
  const doi = input.doi?.trim() ? normalizeDoi(input.doi) : null;
  if (input.doi?.trim() && !doi) {
    return NextResponse.json({ error: "Confira o DOI ou deixe esse campo vazio para salvar manualmente." }, { status: 400 });
  }
  if (doi && [...(workflow.content.discovery?.references ?? []), ...workflow.content.referenceArchive].some((item) => sameReferenceDoi(item.doi, doi))) {
    return NextResponse.json({ error: "Este DOI já está nas referências do mapa." }, { status: 409 });
  }
  const parsedReference = discoveryReferenceSchema.safeParse({
    abstract: nullableText(input.abstract),
    authors: splitAuthors(input.authors),
    doi,
    journal: nullableText(input.journal),
    metadataLookup: doi && input.metadataLookup && sameReferenceDoi(input.metadataLookup.doi, doi) ? { ...input.metadataLookup, doi } : undefined,
    referenceId: `manual-${crypto.randomUUID()}`,
    source: "manual",
    title: input.title.trim(),
    url: doiUrl(doi),
    volumeIssuePages: nullableText(input.volumeIssuePages),
    year: yearFromPublication(input.volumeIssuePages),
  });
  if (!parsedReference.success) {
    return NextResponse.json({ error: "Confira os campos. Separe autores por ponto e vírgula, com até 160 caracteres por nome." }, { status: 400 });
  }
  const reference = parsedReference.data;
  const content = upsertManualReference(workflow.content, reference);
  const saved = await saveWorkflow(workflow, content, supabase, userId);
  return saved
    ? NextResponse.json({ message: "Referência externa salva.", workflow: saved })
    : NextResponse.json({ error: "A referência foi alterada em outra aba." }, { status: 409 });
}
