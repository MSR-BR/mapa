import { USER_PROFILE_ROLE_LABELS, type UserProfileRole } from "./types";

export type UserProfilePresentation = {
  dashboardKicker: string;
  profileLabel: string;
  showAdvisorField: boolean;
};

export const USER_PROFILE_PRESENTATIONS = {
  advisor: {
    dashboardKicker: "Perfil Orientador",
    profileLabel: USER_PROFILE_ROLE_LABELS.advisor,
    showAdvisorField: false,
  },
  student: {
    dashboardKicker: "Perfil Aluno",
    profileLabel: USER_PROFILE_ROLE_LABELS.student,
    showAdvisorField: true,
  },
} as const satisfies Record<UserProfileRole, UserProfilePresentation>;
