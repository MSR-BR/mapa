import Link from "next/link";

import { AuthForm } from "@/modules/auth/auth-form";
import { login } from "@/modules/auth/actions";

export default function LoginPage() {
  return (
    <>
      <p className="eyebrow">Acesso</p>
      <h1>Entre no Mapa da Pesquisa</h1>
      <p className="auth-summary">Acesse seus projetos com e-mail e senha.</p>
      <AuthForm
        action={login}
        alternateHref="/forgot-password"
        alternateLabel="Esqueci minha senha"
        submitLabel="Entrar"
      />
      <p className="auth-footer">Ainda não possui conta? <Link href="/signup">Criar conta</Link></p>
    </>
  );
}
