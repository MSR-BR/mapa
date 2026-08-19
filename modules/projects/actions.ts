"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isResearchMapV2EnabledForClaims } from "@/modules/research-workflow/rollout";
import {
  createResearchWorkflow,
  duplicateResearchWorkflow,
} from "@/modules/research-workflow/storage";

import { normalizeAdvisorEmail } from "./advisor";
import { requireAuthenticatedUser } from "./auth";
import type { AdvisorLinkActionState, ProjectActionState } from "./types";
import { parseProjectForm, readProjectId } from "./validation";
import {
  composeResearchBrief,
  hasResearchProductType,
  parseResearchIntakeJson,
  researchIntakeFromPrompt,
  type ResearchIntake,
} from "./research-intake";

function academicLevelForResearchType(type: ResearchIntake["researchType"]) {
  if (type === "tcc") return "undergraduate" as const;
  if (type === "monografia") return "specialization" as const;
  if (type === "dissertacao") return "masters" as const;
  if (type === "tese") return "doctorate" as const;
  return "other" as const;
}

async function saveProjectAdvisor(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedUser>>["supabase"],
  projectId: string,
  advisorEmail: string | null,
) {
  const { data, error } = await supabase.rpc("set_project_advisor", {
    advisor_email_input: advisorEmail,
    project_id_input: projectId,
  });
  return error ? { error } : { linked: Boolean(data) };
}

export async function createProject(
  _previousState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const autoGenerate = formData.get("autoGenerate") === "yes";
  const legacyPromptMode = formData.get("legacyPromptMode") === "yes";
  const prompt = formData.get("prompt");
  const parsedIntake = legacyPromptMode ? null : parseResearchIntakeJson(formData.get("intakeJson"));
  const intake: ResearchIntake | null = parsedIntake ?? (typeof prompt === "string" && prompt.trim() ? researchIntakeFromPrompt(prompt.trim()) as ResearchIntake : null);
  if (autoGenerate && parsedIntake && !hasResearchProductType(parsedIntake)) {
    return { message: "Escolha o tipo de produto acadêmico antes de iniciar o mapa.", status: "error" };
  }
  if (autoGenerate && intake) {
    formData.set("title", "Nova proposta de pesquisa");
    formData.set("problemStatement", composeResearchBrief(intake));
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

  const { claims, supabase, userId } = await requireAuthenticatedUser();
  const useResearchMapV2 = autoGenerate && isResearchMapV2EnabledForClaims(claims);
  let projectData = result.data;
  if (autoGenerate) {
    projectData = {
      ...result.data,
      academic_level: intake?.researchType ? academicLevelForResearchType(intake.researchType) : result.data.academic_level,
      problem_statement: result.data.problem_statement || result.data.title,
      title: "Nova proposta de pesquisa",
    };
  }
  const { data, error } = await supabase
    .from("projects")
    .insert({
      ...projectData,
      advisor_id: null,
      owner_id: userId,
      workflow_version: useResearchMapV2 ? 2 : 1,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { message: "Não foi possível criar o projeto.", status: "error" };
  }
  if (projectData.advisor_email) {
    const advisorLink = await saveProjectAdvisor(supabase, data.id, projectData.advisor_email);
    if ("error" in advisorLink) {
      const now = new Date().toISOString();
      await supabase
        .from("projects")
        .update({ deleted_at: now, updated_at: now })
        .eq("id", data.id)
        .eq("owner_id", userId);
      return { message: "Não foi possível verificar a conta do orientador.", status: "error" };
    }
  }

  if (useResearchMapV2) {
    try {
      await createResearchWorkflow(supabase, userId, data.id, intake);
    } catch (workflowError) {
      const now = new Date().toISOString();
      await supabase
        .from("projects")
        .update({ deleted_at: now, updated_at: now })
        .eq("id", data.id)
        .eq("owner_id", userId);
      console.error("research_workflow_creation_failed", {
        message: workflowError instanceof Error ? workflowError.message : "unknown-error",
        projectId: data.id,
      });
      return { message: "Não foi possível iniciar o novo mapa.", status: "error" };
    }
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard/projects/${data.id}${useResearchMapV2 ? "?discover=1" : autoGenerate ? "?generate=1" : ""}`);
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
    .update({ ...result.data, advisor_id: null, updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .eq("owner_id", userId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { message: "Projeto não encontrado ou sem permissão.", status: "error" };
  }
  const advisorLink = await saveProjectAdvisor(supabase, projectId, result.data.advisor_email);
  if ("error" in advisorLink) {
    return { message: "Não foi possível verificar a conta do orientador.", status: "error" };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/projects/${projectId}`);
  return { message: "Projeto salvo.", status: "success" };
}

export async function updateProjectAdvisor(
  _previousState: AdvisorLinkActionState,
  formData: FormData,
): Promise<AdvisorLinkActionState> {
  const projectId = readProjectId(formData);
  const rawEmail = formData.get("advisorEmail");
  const advisorEmail = normalizeAdvisorEmail(typeof rawEmail === "string" ? rawEmail : "");
  if (!projectId) return { message: "Projeto inválido.", status: "error", value: advisorEmail ?? "" };
  if (advisorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(advisorEmail)) {
    return { message: "Informe um e-mail válido para o orientador.", status: "error", value: advisorEmail };
  }

  const { supabase } = await requireAuthenticatedUser();
  const advisorLink = await saveProjectAdvisor(supabase, projectId, advisorEmail);
  if ("error" in advisorLink) {
    return { message: "Projeto não encontrado ou sem permissão.", status: "error", value: advisorEmail ?? "" };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/projects/${projectId}`);
  if (!advisorEmail) {
    return { linked: false, message: "Orientador removido deste projeto.", status: "success", value: "" };
  }
  return advisorLink.linked
    ? {
      linked: true,
      message: "Orientador vinculado à conta existente.",
      status: "success",
      value: advisorEmail,
    }
    : {
      linked: false,
      message: "E-mail salvo. O vínculo será concluído quando o orientador entrar com essa conta.",
      status: "success",
      value: advisorEmail,
    };
}

export async function duplicateProject(formData: FormData) {
  const projectId = readProjectId(formData);
  if (!projectId) redirect("/dashboard");

  const { supabase, userId } = await requireAuthenticatedUser();
  const { data: source } = await supabase
    .from("projects")
    .select("title, theme, problem_statement, keywords, knowledge_area, academic_level, advisor_email, advisor_id, workflow_version")
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
  if (source.workflow_version === 2) {
    try {
      await duplicateResearchWorkflow(supabase, userId, projectId, copy.id);
    } catch {
      const now = new Date().toISOString();
      await supabase
        .from("projects")
        .update({ deleted_at: now, updated_at: now })
        .eq("id", copy.id)
        .eq("owner_id", userId);
      redirect("/dashboard?error=duplicate");
    }
  }
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
