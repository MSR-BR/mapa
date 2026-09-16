import { cache } from "react";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  ActorAuthorizationError,
  actorEmail,
  isAccountModeSwitchEnabled,
  requireActorContext,
  type ActorContext,
} from "@/modules/profile/authorization";

import {
  evaluateProjectAuthorization,
  type ProjectCapability,
  type ProjectRelation,
} from "./authorization-policy";

export const requireAuthenticatedUser = cache(async function requireAuthenticatedUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || typeof userId !== "string") redirect("/login");

  return { claims: data!.claims, supabase, userId };
});

type ProjectAuthorizationRow = {
  advisor_email: string | null;
  advisor_id: string | null;
  authoring_role: "student" | "advisor";
  id: string;
  owner_id: string;
};

export type AuthorizedProjectContext = {
  actor: ActorContext;
  project: ProjectAuthorizationRow;
  relation: ProjectRelation;
  supabase: ActorContext["supabase"];
  userId: string;
};

function authorizationErrorFromDecision(code: "profile_mode_mismatch" | "project_not_found") {
  if (code === "project_not_found") {
    return new ActorAuthorizationError("project_not_found", 404, "Projeto não encontrado.");
  }
  return new ActorAuthorizationError(
    "profile_mode_mismatch",
    403,
    "Esta ação não está disponível no perfil ativo.",
  );
}

async function loadAuthorizationProject(actor: ActorContext, projectId: string) {
  const { data, error } = await actor.supabase
    .from("projects")
    .select("id,owner_id,authoring_role,advisor_id,advisor_email")
    .eq("id", projectId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) {
    throw new ActorAuthorizationError(
      "profile_unavailable",
      503,
      "Não foi possível verificar a autorização agora.",
      { cause: error },
    );
  }
  return data;
}

export function assertAuthorizedProjectCapability(
  context: Pick<AuthorizedProjectContext, "actor" | "project">,
  capability: ProjectCapability,
) {
  const { actor, project } = context;
  const decision = evaluateProjectAuthorization({
    actor: {
      activeRole: actor.activeRole,
      email: actorEmail(actor),
      userId: actor.userId,
    },
    capability,
    project: {
      advisorEmail: project.advisor_email,
      advisorId: project.advisor_id,
      authoringRole: project.authoring_role,
      ownerId: project.owner_id,
    },
    strictMode: isAccountModeSwitchEnabled(),
  });
  if (!decision.allowed) throw authorizationErrorFromDecision(decision.code);
  return decision.relation;
}

export function authorizeProjectCapabilityResponse(
  context: Pick<AuthorizedProjectContext, "actor" | "project">,
  capability: ProjectCapability,
) {
  try {
    assertAuthorizedProjectCapability(context, capability);
    return null;
  } catch (error) {
    return authorizationErrorResponse(error);
  }
}

export async function authorizeProject(
  projectId: string,
  capability: ProjectCapability,
  options: { expectedRoleVersion?: number; requireLegalConsent?: boolean } = {},
): Promise<AuthorizedProjectContext> {
  const actor = await requireActorContext(options);
  if (
    (capability === "advisor_review" || capability === "related_read" || capability === "reminder")
    && actor.activeRole === "advisor"
  ) {
    const { error } = await actor.supabase.rpc("claim_pending_advisor_projects");
    if (error && isAccountModeSwitchEnabled()) {
      throw new ActorAuthorizationError(
        "profile_unavailable",
        503,
        "Não foi possível confirmar o vínculo de orientação agora.",
        { cause: error },
      );
    }
  }
  const project = await loadAuthorizationProject(actor, projectId);
  if (!project) throw authorizationErrorFromDecision("project_not_found");

  const relation = assertAuthorizedProjectCapability({ actor, project }, capability);
  return {
    actor,
    project,
    relation,
    supabase: actor.supabase,
    userId: actor.userId,
  };
}

export async function authorizeOwnedProjects(
  projectIds: string[],
  options: { expectedRoleVersion?: number; requireLegalConsent?: boolean } = {},
) {
  const actor = await requireActorContext(options);
  const { data, error } = await actor.supabase
    .from("projects")
    .select("id,owner_id,authoring_role,advisor_id,advisor_email")
    .in("id", projectIds)
    .is("deleted_at", null);
  if (error) {
    throw new ActorAuthorizationError(
      "profile_unavailable",
      503,
      "Não foi possível verificar a autorização agora.",
      { cause: error },
    );
  }
  if (!data || data.length !== projectIds.length) {
    throw authorizationErrorFromDecision("project_not_found");
  }
  for (const project of data) {
    const decision = evaluateProjectAuthorization({
      actor: {
        activeRole: actor.activeRole,
        email: actorEmail(actor),
        userId: actor.userId,
      },
      capability: "owner",
      project: {
        advisorEmail: project.advisor_email,
        advisorId: project.advisor_id,
        authoringRole: project.authoring_role,
        ownerId: project.owner_id,
      },
      strictMode: isAccountModeSwitchEnabled(),
    });
    if (!decision.allowed) throw authorizationErrorFromDecision(decision.code);
  }
  return { actor, projects: data, supabase: actor.supabase, userId: actor.userId };
}

export function expectedRoleVersionFromRequest(request: Request) {
  const value = request.headers.get("x-profile-role-version");
  if (value === null || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : Number.NaN;
}

export function expectedRoleVersionFromFormData(formData: FormData) {
  const value = formData.get("profileRoleVersion");
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : Number.NaN;
}

export function authorizationErrorResponse(error: unknown) {
  if (!(error instanceof ActorAuthorizationError)) throw error;
  return NextResponse.json(
    { code: error.code, error: error.message },
    {
      headers: { "Cache-Control": "private, no-store" },
      status: error.status,
    },
  );
}

export async function authorizeProjectRoute(input: {
  capability?: ProjectCapability;
  mutation?: boolean;
  projectId: string;
  request: Request;
}) {
  try {
    const value = await authorizeProject(
      input.projectId,
      input.capability ?? "owner",
      input.mutation
        ? {
          expectedRoleVersion: expectedRoleVersionFromRequest(input.request),
          requireLegalConsent: true,
        }
        : { requireLegalConsent: true },
    );
    return { ok: true as const, value };
  } catch (error) {
    return { ok: false as const, response: authorizationErrorResponse(error) };
  }
}

export async function authorizeOwnedProjectsRoute(input: {
  mutation?: boolean;
  projectIds: string[];
  request: Request;
}) {
  try {
    const value = await authorizeOwnedProjects(
      input.projectIds,
      input.mutation
        ? {
          expectedRoleVersion: expectedRoleVersionFromRequest(input.request),
          requireLegalConsent: true,
        }
        : { requireLegalConsent: true },
    );
    return { ok: true as const, value };
  } catch (error) {
    return { ok: false as const, response: authorizationErrorResponse(error) };
  }
}
