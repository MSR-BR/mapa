import { setActiveProfileRole } from "./actions";
import { trackAnalyticsEvent } from "@/modules/analytics/analytics";

export function ProfileModePrompt({ email }: { email: string }) {
  return (
    <div className="profile-mode-backdrop" role="presentation">
      <section
        aria-labelledby="profile-mode-title"
        aria-modal="true"
        className="profile-mode-card"
        role="dialog"
      >
        <p className="section-kicker">Primeiro acesso</p>
        <h2 id="profile-mode-title">Como você quer usar o Mapa?</h2>
        <p>
          Esta escolha organiza o dashboard e as ações disponíveis para {email || "sua conta"}.
          Você poderá trocar depois pelo ícone do usuário.
        </p>
        <div className="profile-mode-options">
          <form action={setActiveProfileRole} onSubmit={() => trackAnalyticsEvent("profile_role_selected", { profile_role: "student", source: "dashboard" })}>
            <input name="role" type="hidden" value="student" />
            <button type="submit">
              <strong>Sou aluno</strong>
              <span>Crio meus mapas e envio etapas para validação do orientador.</span>
            </button>
          </form>
          <form action={setActiveProfileRole} onSubmit={() => trackAnalyticsEvent("profile_role_selected", { profile_role: "advisor", source: "dashboard" })}>
            <input name="role" type="hidden" value="advisor" />
            <button type="submit">
              <strong>Sou orientador</strong>
              <span>Vejo projetos vinculados ao meu e-mail e valido etapas dos estudantes.</span>
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
