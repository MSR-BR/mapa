"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

import { isBugReportAdminEmail } from "@/modules/bug-reports/config";
import { USER_PROFILE_PRESENTATIONS } from "@/modules/profile/presentation";
import { type UserProfileRole } from "@/modules/profile/types";
import { trackAnalyticsEvent } from "@/modules/analytics/analytics";

import { logout } from "./actions";

type Props = {
  accountModeSwitchEnabled?: boolean;
  activeRole?: UserProfileRole;
  avatarUrl?: string;
  displayName?: string;
  email: string;
  initials: string;
};

export function AccountMenu({ accountModeSwitchEnabled, activeRole, avatarUrl, displayName, email, initials }: Props) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const profilePresentation = activeRole ? USER_PROFILE_PRESENTATIONS[activeRole] : null;

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
          <span>Perfil da conta</span>
          <strong>{profilePresentation?.profileLabel ?? "Não definido"}</strong>
        </div>
        {accountModeSwitchEnabled && activeRole ? <Link className="account-menu-link" href="/dashboard/settings">Configurações</Link> : null}
        {isBugReportAdminEmail(email) ? <Link className="account-menu-admin-link" href="/admin/bugs">Relatos de problemas</Link> : null}
        <form action={logout} onSubmit={() => trackAnalyticsEvent("logout", { auth_state: "authenticated", profile_role: activeRole ?? "unknown", source: "dashboard" })}><button type="submit">Sair</button></form>
      </div>
    </details>
  );
}
