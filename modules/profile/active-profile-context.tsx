"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { UserProfileRole } from "./types";

type ActiveProfileContextValue = {
  activeRole: UserProfileRole;
  roleVersion: number;
};

const ActiveProfileContext = createContext<ActiveProfileContextValue | null>(null);

export function ActiveProfileProvider({
  activeRole,
  children,
  roleVersion,
}: ActiveProfileContextValue & { children: ReactNode }) {
  return (
    <ActiveProfileContext.Provider value={{ activeRole, roleVersion }}>
      {children}
    </ActiveProfileContext.Provider>
  );
}

export function useActiveProfile() {
  const profile = useContext(ActiveProfileContext);
  if (!profile) throw new Error("Active profile context is unavailable.");
  return profile;
}

export function profileMutationHeaders(roleVersion: number) {
  return { "x-profile-role-version": String(roleVersion) };
}
