export const STUDENT_ADVISOR_REQUIRED_CODE = "student_advisor_required";

export const STUDENT_ADVISOR_REQUIRED_MESSAGE =
  "Informe o e-mail do orientador antes de validar. No perfil Aluno, a etapa só avança depois da revisão e aprovação do orientador.";

type AdvisorRequirementInput = {
  advisorEmail: string | null | undefined;
  authoringRole: "student" | "advisor";
};

export type ProjectAdvisorGate =
  | { advisorEmail: null; kind: "self_directed" }
  | { advisorEmail: null; kind: "advisor_required" }
  | { advisorEmail: string; kind: "advisor_review" };

export function projectAdvisorGate(input: AdvisorRequirementInput): ProjectAdvisorGate {
  if (input.authoringRole === "advisor") {
    return { advisorEmail: null, kind: "self_directed" };
  }

  const advisorEmail = input.advisorEmail?.trim().toLocaleLowerCase("pt-BR") || null;
  return advisorEmail
    ? { advisorEmail, kind: "advisor_review" }
    : { advisorEmail: null, kind: "advisor_required" };
}
