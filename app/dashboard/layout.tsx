import Link from "next/link";

import { logout } from "@/modules/auth/actions";
import { requireAuthenticatedUser } from "@/modules/projects/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAuthenticatedUser();

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link className="app-brand" href="/dashboard">
          <span className="app-brand-mark" aria-hidden="true">M</span>
          <span>Mapa da Pesquisa</span>
        </Link>
        <nav aria-label="Navegação principal">
          <Link className="nav-projects-link" href="/dashboard">Projetos</Link>
          <details className="account-menu">
            <summary aria-label="Abrir menu da conta">Conta</summary>
            <div className="account-menu-panel">
              <form action={logout}><button type="submit">Sair</button></form>
            </div>
          </details>
        </nav>
      </header>
      {children}
    </div>
  );
}
