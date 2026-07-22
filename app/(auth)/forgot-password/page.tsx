import { AuthForm } from "@/modules/auth/auth-form";
import { requestPasswordReset } from "@/modules/auth/actions";

export default function ForgotPasswordPage() {
  return (
    <>
      <p className="eyebrow">Recuperação</p>
      <h1>Recupere sua senha</h1>
      <p className="auth-summary">Enviaremos instruções caso o e-mail pertença a uma conta.</p>
      <AuthForm
        action={requestPasswordReset}
        alternateHref="/login"
        alternateLabel="Voltar para o acesso"
        emailOnly
        submitLabel="Enviar instruções"
      />
    </>
  );
}
