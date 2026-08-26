"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

import { isBugReportAdminEmail } from "@/modules/bug-reports/config";
import { setActiveProfileRole } from "@/modules/profile/actions";
import { USER_PROFILE_ROLE_LABELS, type UserProfileRole } from "@/modules/profile/types";
import { trackAnalyticsEvent } from "@/modules/analytics/analytics";

import { logout } from "./actions";

type Props = {
  activeRole: UserProfileRole;
  avatarUrl?: string;
  displayName?: string;
  email: string;
  initials: string;
};

export function AccountMenu({ activeRole, avatarUrl, displayName, email, initials }: Props) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const nextRole: UserProfileRole = activeRole === "advisor" ? "student" : "advisor";

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      const details = detailsRef.current;
      if (details?.open && !details.contains(event.target as Node)) details.open = false;
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && detailsRef.current?.open) detailsRef.current.open = false;
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <details className="account-menu" ref={detailsRef}>
      <summary aria-label="Abrir menu da conta">
        <span
          className={`account-avatar ${avatarUrl ? "has-photo" : ""}`}
          style={avatarUrl ? { backgroundImage: `url("${avatarUrl.replaceAll('"', "%22")}")` } : undefined}
        >
          {avatarUrl ? null : initials}
        </span>
      </summary>
      <div className="account-menu-panel">
        <div className="account-identity">
          {displayName ? <strong>{displayName}</strong> : null}
          {email ? <span>{email}</span> : null}
        </div>
        <div className="account-profile-switch">
          <span>Modo atual</span>
          <strong>{USER_PROFILE_ROLE_LABELS[activeRole]}</strong>
          <form action={setActiveProfileRole} onSubmit={() => trackAnalyticsEvent("profile_role_selected", { profile_role: nextRole, source: "dashboard" })}>
            <input name="role" type="hidden" value={nextRole} />
            <button type="submit">Mudar para {USER_PROFILE_ROLE_LABELS[nextRole].toLocaleLowerCase("pt-BR")}</button>
          </form>
        </div>
        {isBugReportAdminEmail(email) ? <Link className="account-menu-admin-link" href="/admin/bugs">Relatos de problemas</Link> : null}
        <form action={logout} onSubmit={() => trackAnalyticsEvent("logout", { auth_state: "authenticated", profile_role: activeRole, source: "dashboard" })}><button type="submit">Sair</button></form>
      </div>
    </details>
  );
}
