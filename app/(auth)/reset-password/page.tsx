import { AuthForm } from "@/modules/auth/auth-form";
import { updatePassword } from "@/modules/auth/actions";

export default function ResetPasswordPage() {
  return (
    <>
      <p className="eyebrow">Nova senha</p>
      <h1>Defina uma nova senha</h1>
      <p className="auth-summary">Escolha uma senha com pelo menos oito caracteres.</p>
      <AuthForm action={updatePassword} passwordOnly submitLabel="Atualizar senha" />
    </>
  );
}
