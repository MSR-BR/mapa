import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { logout } from "@/modules/auth/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) redirect("/login");

  const email = typeof data.claims.email === "string" ? data.claims.email : "Conta autenticada";

  return (
    <main className="dashboard-shell">
      <section className="dashboard-card">
        <p className="eyebrow">Área pessoal</p>
        <h1>Seus projetos</h1>
        <p className="auth-summary">Sessão ativa para {email}.</p>
        <div className="empty-state">
          O gerenciamento de projetos será implementado na próxima parcela.
        </div>
        <form action={logout}>
          <button className="secondary-button" type="submit">Sair</button>
        </form>
      </section>
    </main>
  );
}
