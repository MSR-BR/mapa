import Link from "next/link";

import { logout } from "@/modules/auth/actions";
import { requireAuthenticatedUser } from "@/modules/projects/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAuthenticatedUser();

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link className="app-brand" href="/dashboard">Mapa da Pesquisa</Link>
        <nav aria-label="Navegação principal">
          <Link href="/dashboard">Projetos</Link>
          <form action={logout}><button type="submit">Sair</button></form>
        </nav>
      </header>
      {children}
    </div>
  );
}
