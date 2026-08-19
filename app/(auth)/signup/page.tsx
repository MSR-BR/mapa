import Link from "next/link";

import { AuthForm } from "@/modules/auth/auth-form";
import { signUp } from "@/modules/auth/actions";

function safeNext(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard?continue=1";
}

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const destination = safeNext(next);
  return (
    <>
      <p className="eyebrow">Cadastro</p>
      <h1>Crie sua conta</h1>
      <p className="auth-summary">Use uma senha com pelo menos oito caracteres.</p>
      <AuthForm action={signUp} hiddenFields={{ next: destination }} submitLabel="Criar conta" />
      <p className="auth-footer">Já possui conta? <Link href={`/login?next=${encodeURIComponent(destination)}`}>Entrar</Link></p>
    </>
  );
}
