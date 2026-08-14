export const USER_PROFILE_ROLES = ["student", "advisor"] as const;

export type UserProfileRole = typeof USER_PROFILE_ROLES[number];

export const USER_PROFILE_ROLE_LABELS: Record<UserProfileRole, string> = {
  advisor: "Orientador",
  student: "Aluno",
};

export function isUserProfileRole(value: unknown): value is UserProfileRole {
  return USER_PROFILE_ROLES.some((role) => role === value);
}
