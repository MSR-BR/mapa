import { setInitialProfileRole } from "./actions";

export function ProfileModePrompt({ allowModeSwitch, email }: { allowModeSwitch: boolean; email: string }) {
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
          {allowModeSwitch
            ? " Você poderá alterar o perfil depois em Configurações."
            : " Essa escolha define sua área de trabalho e será mantida nesta conta."}
        </p>
        <div className="profile-mode-options">
          <form action={setInitialProfileRole}>
            <input name="role" type="hidden" value="student" />
            <button type="submit">
              <strong>Sou aluno</strong>
              <span>Crio meus mapas e envio etapas para validação do orientador.</span>
            </button>
          </form>
          <form action={setInitialProfileRole}>
            <input name="role" type="hidden" value="advisor" />
            <button type="submit">
              <strong>Sou orientador</strong>
              <span>Crio meus próprios mapas e também reviso projetos vinculados ao meu e-mail.</span>
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
