"use client";

import { useEffect } from "react";

import { PENDING_PROJECT_KEY } from "./public-start-form";

/** Clear the public intake only after the create-project action succeeded. */
export function PendingProjectCleanup() {
  useEffect(() => {
    localStorage.removeItem(PENDING_PROJECT_KEY);
  }, []);

  return null;
}
