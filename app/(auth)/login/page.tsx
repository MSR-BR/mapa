import Link from "next/link";

import { AuthForm } from "@/modules/auth/auth-form";
import { login, loginWithGoogle } from "@/modules/auth/actions";

function safeNext(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard?continue=1";
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const googleAuthEnabled = process.env.GOOGLE_AUTH_ENABLED === "true";
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
      {googleAuthEnabled ? (
        <>
          <div className="auth-divider"><span>ou</span></div>
          <form action={loginWithGoogle}>
            <input name="next" type="hidden" value={safeNext(next)} />
            <button className="google-auth-button" data-analytics-event="login" type="submit">
              <span aria-hidden="true" className="google-mark">G</span>
              Continuar com Google
            </button>
          </form>
        </>
      ) : null}
      <p className="auth-footer">Ainda não possui conta? <Link href="/signup">Criar conta</Link></p>
    </>
  );
}
