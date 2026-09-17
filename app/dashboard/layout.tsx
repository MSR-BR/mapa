import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountMenu } from "@/modules/auth/account-menu";
import { BrandLogo } from "@/modules/branding/brand-logo";
import { LegalConsentGate } from "@/modules/legal/legal-consent-gate";
import { LegalLinks } from "@/modules/legal/legal-links";
import {
  ActorAuthorizationError,
  isAccountModeSwitchEnabled,
  loadActorContext,
} from "@/modules/profile/authorization";
import { ActiveProfileProvider } from "@/modules/profile/active-profile-context";
import { AccountModeSync } from "@/modules/profile/account-mode-sync";
import { ProfileModePrompt } from "@/modules/profile/profile-mode-prompt";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let actorState: Awaited<ReturnType<typeof loadActorContext>>;
  try {
    actorState = await loadActorContext();
  } catch (error) {
    if (error instanceof ActorAuthorizationError && error.code === "authentication_required") {
      redirect("/login");
    }
    throw error;
  }

  const identity = actorState.status === "ready" ? actorState.actor : actorState.identity;
  const profile = actorState.status === "ready" ? actorState.actor : null;
  const accountModeSwitchEnabled = isAccountModeSwitchEnabled();
  const metadata = (
    identity.claims.user_metadata && typeof identity.claims.user_metadata === "object"
      ? identity.claims.user_metadata
      : {}
  ) as Record<string, unknown>;
  const email = typeof identity.claims.email === "string" ? identity.claims.email : "";
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
          <BrandLogo variant="wordmark" priority />
        </Link>
        <nav aria-label="Navegação principal">
          <Link className="nav-dashboard-button" href="/dashboard">Dashboard</Link>
          <AccountMenu
            accountModeSwitchEnabled={accountModeSwitchEnabled}
            activeRole={profile?.activeRole}
            avatarUrl={avatarUrl}
            displayName={displayName}
            email={email}
            initials={initials}
          />
        </nav>
      </header>
      {accountModeSwitchEnabled ? <AccountModeSync /> : null}
      {!profile ? <ProfileModePrompt allowModeSwitch={accountModeSwitchEnabled} email={email} /> : null}
      {profile && !profile.hasLegalConsent ? <LegalConsentGate activeRole={profile.activeRole} roleVersion={profile.roleVersion} /> : null}
      {profile ? (
        <ActiveProfileProvider activeRole={profile.activeRole} roleVersion={profile.roleVersion}>
          {children}
        </ActiveProfileProvider>
      ) : children}
      <LegalLinks defaultEmail={email} />
    </div>
  );
}
