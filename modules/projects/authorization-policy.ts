import type { UserProfileRole } from "@/modules/profile/types";

export type ProjectCapability =
  | "advisor_review"
  | "owner"
  | "related_read"
  | "reminder"
  | "student_supervision";

export type ProjectRelation = "advisor" | "owner";

export type AuthorizationActorSnapshot = {
  activeRole: UserProfileRole;
  email: string | null;
  userId: string;
};

export type AuthorizationProjectSnapshot = {
  advisorEmail: string | null;
  advisorId: string | null;
  authoringRole: UserProfileRole;
  ownerId: string;
};

export type ProjectAuthorizationDecision =
  | { allowed: true; relation: ProjectRelation }
  | {
    allowed: false;
    code: "profile_mode_mismatch" | "project_not_found";
  };

function normalizedEmail(value: string | null) {
  return value?.trim().toLocaleLowerCase("pt-BR") || null;
}

function isLinkedAdvisor(
  actor: AuthorizationActorSnapshot,
  project: AuthorizationProjectSnapshot,
  allowEmailFallback: boolean,
) {
  if (project.ownerId === actor.userId) return false;
  if (project.advisorId === actor.userId) return true;
  if (!allowEmailFallback) return false;
  const projectEmail = normalizedEmail(project.advisorEmail);
  return Boolean(projectEmail && actor.email && projectEmail === normalizedEmail(actor.email));
}

function modeMismatch(): ProjectAuthorizationDecision {
  return { allowed: false, code: "profile_mode_mismatch" };
}

function notFound(): ProjectAuthorizationDecision {
  return { allowed: false, code: "project_not_found" };
}

export function evaluateProjectAuthorization(input: {
  actor: AuthorizationActorSnapshot;
  capability: ProjectCapability;
  project: AuthorizationProjectSnapshot | null;
  strictMode: boolean;
}): ProjectAuthorizationDecision {
  const { actor, capability, project, strictMode } = input;
  if (!project) return notFound();

  const isOwner = project.ownerId === actor.userId;
  const isAdvisor = isLinkedAdvisor(actor, project, !strictMode);

  if (capability === "owner") {
    if (!isOwner) return notFound();
    if (strictMode && project.authoringRole !== actor.activeRole) return modeMismatch();
    return { allowed: true, relation: "owner" };
  }

  if (capability === "student_supervision") {
    if (!isOwner) return notFound();
    if (
      strictMode
      && (actor.activeRole !== "student" || project.authoringRole !== "student")
    ) return modeMismatch();
    return { allowed: true, relation: "owner" };
  }

  if (capability === "advisor_review") {
    if (!isAdvisor) return notFound();
    if (actor.activeRole !== "advisor") return modeMismatch();
    if (strictMode && project.authoringRole !== "student") return modeMismatch();
    return { allowed: true, relation: "advisor" };
  }

  if (capability === "reminder") {
    if (isOwner) {
      if (actor.activeRole !== "student") return modeMismatch();
      if (strictMode && project.authoringRole !== "student") return modeMismatch();
      return { allowed: true, relation: "owner" };
    }
    if (!isAdvisor) return notFound();
    if (actor.activeRole !== "advisor") return modeMismatch();
    if (strictMode && project.authoringRole !== "student") return modeMismatch();
    return { allowed: true, relation: "advisor" };
  }

  if (isOwner) {
    if (strictMode && project.authoringRole !== actor.activeRole) return modeMismatch();
    return { allowed: true, relation: "owner" };
  }
  if (!isAdvisor) return notFound();
  if (actor.activeRole !== "advisor") return modeMismatch();
  if (strictMode && project.authoringRole !== "student") return modeMismatch();
  return { allowed: true, relation: "advisor" };
}
