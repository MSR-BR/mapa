import Link from "next/link";

import { AuthForm } from "@/modules/auth/auth-form";
import { signUp } from "@/modules/auth/actions";

export default function SignupPage() {
  return (
    <>
      <p className="eyebrow">Cadastro</p>
      <h1>Crie sua conta</h1>
      <p className="auth-summary">Use uma senha com pelo menos oito caracteres.</p>
      <AuthForm action={signUp} submitLabel="Criar conta" />
      <p className="auth-footer">Já possui conta? <Link href="/login">Entrar</Link></p>
    </>
  );
}
