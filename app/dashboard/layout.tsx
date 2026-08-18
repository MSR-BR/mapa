import Link from "next/link";
import type { Metadata } from "next";

import { AccountMenu } from "@/modules/auth/account-menu";
import { ProfileModePrompt } from "@/modules/profile/profile-mode-prompt";
import { loadUserProfile } from "@/modules/profile/storage";
import { requireAuthenticatedUser } from "@/modules/projects/auth";
import { LegalConsentGate } from "@/modules/legal/legal-consent-gate";
import { LegalLinks } from "@/modules/legal/legal-links";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { claims, supabase, userId } = await requireAuthenticatedUser();
  const profile = await loadUserProfile(supabase, userId);
  const metadata = (
    claims.user_metadata && typeof claims.user_metadata === "object"
      ? claims.user_metadata
      : {}
  ) as Record<string, unknown>;
  const email = typeof claims.email === "string" ? claims.email : "";
  const displayName = [metadata.full_name, metadata.name].find((value) => typeof value === "string") as string | undefined;
  const avatarUrl = [metadata.avatar_url, metadata.picture].find((value) => typeof value === "string") as string | undefined;
  const initialsSource = displayName || email.split("@")[0] || "U";
  const initials = initialsSource
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link className="app-brand" href="/dashboard">
          <span className="app-brand-mark" aria-hidden="true">M</span>
          <span>Mapa da Pesquisa</span>
        </Link>
        <nav aria-label="Navegação principal">
          <Link className="nav-dashboard-button" href="/dashboard">Dashboard</Link>
          <AccountMenu
            activeRole={profile.activeRole}
            avatarUrl={avatarUrl}
            displayName={displayName}
            email={email}
            initials={initials}
          />
        </nav>
      </header>
      {!profile.hasProfile ? <ProfileModePrompt email={email} /> : null}
      {profile.hasProfile && !profile.hasLegalConsent ? <LegalConsentGate activeRole={profile.activeRole} /> : null}
      {children}
      <LegalLinks />
    </div>
  );
}
