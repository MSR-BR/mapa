import Link from "next/link";

import { AccountMenu } from "@/modules/auth/account-menu";
import { requireAuthenticatedUser } from "@/modules/projects/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { claims } = await requireAuthenticatedUser();
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
          <AccountMenu avatarUrl={avatarUrl} displayName={displayName} email={email} initials={initials} />
        </nav>
      </header>
      {children}
    </div>
  );
}
