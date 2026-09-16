import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountModeSettings } from "@/modules/profile/account-mode-settings";
import {
  ActorAuthorizationError,
  isAccountModeSwitchEnabled,
  loadActorContext,
} from "@/modules/profile/authorization";

export const metadata: Metadata = {
  title: "Configurações da conta",
  robots: { follow: false, index: false },
};

export default async function AccountSettingsPage() {
  if (!isAccountModeSwitchEnabled()) redirect("/dashboard");

  let actorState: Awaited<ReturnType<typeof loadActorContext>>;
  try {
    actorState = await loadActorContext();
  } catch (error) {
    if (error instanceof ActorAuthorizationError && error.code === "authentication_required") {
      redirect("/login");
    }
    throw error;
  }
  if (actorState.status !== "ready") redirect("/dashboard");

  return (
    <main className="workspace-shell account-settings-shell">
      <Link className="settings-back-link" href="/dashboard">← Voltar ao dashboard</Link>
      <header className="account-settings-heading">
        <p className="section-kicker">Configurações</p>
        <h1>Preferências da conta</h1>
        <p>Alterne o contexto de trabalho sem criar outro cadastro e sem perder seus projetos.</p>
      </header>
      <AccountModeSettings
        activeRole={actorState.actor.activeRole}
        key={`${actorState.actor.activeRole}-${actorState.actor.roleVersion}`}
        roleVersion={actorState.actor.roleVersion}
      />
    </main>
  );
}
