"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { interpretResearchRequest } from "@/modules/generation/gemini";

import { requireAuthenticatedUser } from "./auth";
import type { ProjectActionState } from "./types";
import { parseProjectForm, readProjectId } from "./validation";

export async function createProject(
  _previousState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const autoGenerate = formData.get("autoGenerate") === "yes";
  const prompt = formData.get("prompt");
  if (autoGenerate && typeof prompt === "string" && prompt.trim()) {
    const normalizedPrompt = prompt.trim();
    formData.set("title", normalizedPrompt.slice(0, 160));
    formData.set("problemStatement", normalizedPrompt.slice(0, 5_000));
  }
  const result = parseProjectForm(formData);
  if (!result.success) {
    return {
      fieldErrors: result.fieldErrors,
      message: "Revise os campos indicados.",
      status: "error",
      values: result.values,
    };
  }

  const { supabase, userId } = await requireAuthenticatedUser();
  let projectData = result.data;
  if (autoGenerate) {
    try {
      const interpreted = await interpretResearchRequest(result.data);
      projectData = {
        ...result.data,
        keywords: interpreted.keywords,
        knowledge_area: interpreted.knowledgeAreaProposed
          ? `Área proposta: ${interpreted.knowledgeArea}`.slice(0, 120)
          : interpreted.knowledgeArea,
        theme: interpreted.researchQuery,
        title: interpreted.title,
      };
    } catch (error) {
      console.error("project_prompt_interpretation_failed", {
        message: error instanceof Error ? error.message : "unknown-error",
        userId,
      });
      return { message: "Não foi possível interpretar o tema. Tente novamente.", status: "error" };
    }
  }
  const { data, error } = await supabase
    .from("projects")
    .insert({ ...projectData, owner_id: userId })
    .select("id")
    .single();

  if (error || !data) {
    return { message: "Não foi possível criar o projeto.", status: "error" };
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard/projects/${data.id}${autoGenerate ? "?generate=1" : ""}`);
}

export async function updateProject(
  _previousState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const projectId = readProjectId(formData);
  const result = parseProjectForm(formData);
  if (!result.success) {
    return {
      fieldErrors: result.fieldErrors,
      message: "Revise os campos indicados.",
      status: "error",
      values: result.values,
    };
  }
  if (!projectId) return { message: "Projeto inválido.", status: "error" };

  const { supabase, userId } = await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from("projects")
    .update({ ...result.data, updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .eq("owner_id", userId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { message: "Projeto não encontrado ou sem permissão.", status: "error" };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/projects/${projectId}`);
  return { message: "Projeto salvo.", status: "success" };
}

export async function duplicateProject(formData: FormData) {
  const projectId = readProjectId(formData);
  if (!projectId) redirect("/dashboard");

  const { supabase, userId } = await requireAuthenticatedUser();
  const { data: source } = await supabase
    .from("projects")
    .select("title, theme, problem_statement, keywords, knowledge_area, academic_level")
    .eq("id", projectId)
    .eq("owner_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!source) redirect("/dashboard");

  const copyTitle = `${source.title} (cópia)`.slice(0, 160);
  const { data: copy, error } = await supabase
    .from("projects")
    .insert({ ...source, owner_id: userId, status: "draft", title: copyTitle })
    .select("id")
    .single();

  if (error || !copy) redirect("/dashboard?error=duplicate");
  revalidatePath("/dashboard");
  redirect(`/dashboard/projects/${copy.id}`);
}

export async function deleteProject(formData: FormData) {
  const projectId = readProjectId(formData);
  const confirmed = formData.get("confirmDelete") === "yes";
  if (!projectId || !confirmed) redirect("/dashboard?error=delete-confirmation");

  const { supabase, userId } = await requireAuthenticatedUser();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("projects")
    .update({ deleted_at: now, updated_at: now })
    .eq("id", projectId)
    .eq("owner_id", userId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error || !data) redirect("/dashboard?error=delete");

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
