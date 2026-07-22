import Link from "next/link";

import { AuthForm } from "@/modules/auth/auth-form";
import { login } from "@/modules/auth/actions";

function safeNext(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <p className="eyebrow">Acesso</p>
      <h1>Entre no Mapa da Pesquisa</h1>
      <p className="auth-summary">Acesse seus projetos com e-mail e senha.</p>
      <AuthForm
        action={login}
        alternateHref="/forgot-password"
        alternateLabel="Esqueci minha senha"
        hiddenFields={{ next: safeNext(next) }}
        submitLabel="Entrar"
      />
      <p className="auth-footer">Ainda não possui conta? <Link href="/signup">Criar conta</Link></p>
    </>
  );
}
