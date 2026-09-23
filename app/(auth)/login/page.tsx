import Link from "next/link";

import { AuthForm } from "@/modules/auth/auth-form";
import { login, loginWithSocialProvider } from "@/modules/auth/actions";
import {
  isSocialAuthProviderEnabled,
  readSafeAuthDestination,
  readSocialAuthErrorCode,
} from "@/modules/auth/oauth-contract";
import { SocialAuthErrorNotice, SocialAuthForm } from "@/modules/auth/social-auth-form";

const authErrorMessages = {
  access: "Não foi possível concluir o acesso. Tente novamente; seu rascunho continua salvo.",
  google: "Não foi possível concluir o acesso com o Google. Tente novamente ou entre com e-mail e senha; seu rascunho continua salvo.",
  linkedin: "Não foi possível concluir o acesso com o LinkedIn. Tente novamente ou entre com e-mail e senha; seu rascunho continua salvo.",
} as const;

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  const destination = readSafeAuthDestination(next);
  const authError = readSocialAuthErrorCode(error);
  const googleAuthEnabled = isSocialAuthProviderEnabled("google");
  const linkedinAuthEnabled = isSocialAuthProviderEnabled("linkedin_oidc");
  const hasSocialAuth = googleAuthEnabled || linkedinAuthEnabled;
  return (
    <>
      <p className="eyebrow">Acesso</p>
      <h1>Entre no Mapa da Pesquisa</h1>
      <p className="auth-summary">Acesse seus projetos com e-mail e senha{hasSocialAuth ? " ou uma das opções disponíveis" : ""}.</p>
      {authError ? <SocialAuthErrorNotice code={authError} message={authErrorMessages[authError]} /> : null}
      <AuthForm
        action={login}
        alternateHref="/forgot-password"
        alternateLabel="Esqueci minha senha"
        hiddenFields={{ next: destination }}
        submitLabel="Entrar"
      />
      {hasSocialAuth ? (
        <>
          <div className="auth-divider"><span>ou</span></div>
          <div className="social-auth-options">
            {googleAuthEnabled ? (
              <SocialAuthForm action={loginWithSocialProvider} destination={destination} label="Google" mark="G" provider="google" source="google" />
            ) : null}
            {linkedinAuthEnabled ? (
              <SocialAuthForm action={loginWithSocialProvider} destination={destination} label="LinkedIn" mark="in" provider="linkedin_oidc" source="linkedin" />
            ) : null}
          </div>
        </>
      ) : null}
      <p className="auth-footer">Ainda não possui conta? <Link href={`/signup?next=${encodeURIComponent(destination)}`}>Criar conta</Link></p>
    </>
  );
}
