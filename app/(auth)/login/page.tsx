import { loginWithSocialProvider } from "@/modules/auth/actions";
import {
  isSocialAuthProviderEnabled,
  readSafeAuthDestination,
  readSocialAuthErrorCode,
} from "@/modules/auth/oauth-contract";
import { SocialAuthErrorNotice, SocialAuthForm } from "@/modules/auth/social-auth-form";

const authErrorMessages = {
  access: "Não foi possível concluir o acesso. Tente novamente; seu rascunho continua salvo.",
  google: "Não foi possível concluir o acesso com o Google. Tente novamente; seu rascunho continua salvo.",
} as const;

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string; notice?: string }> }) {
  const { error, next, notice } = await searchParams;
  const destination = readSafeAuthDestination(next);
  const authError = readSocialAuthErrorCode(error);
  const googleAuthEnabled = isSocialAuthProviderEnabled("google");

  return (
    <>
      <p className="eyebrow">Acesso</p>
      <h1>Entre no Mapa da Pesquisa</h1>
      <p className="auth-summary">Acesse ou crie sua conta com o Google.</p>
      {notice === "google-only" ? <p className="form-message success" role="status">O acesso por e-mail e senha foi encerrado. Continue com sua conta Google.</p> : null}
      {authError ? <SocialAuthErrorNotice code={authError} message={authErrorMessages[authError]} /> : null}
      {googleAuthEnabled ? (
        <div className="social-auth-options social-auth-options-primary">
          <SocialAuthForm action={loginWithSocialProvider} destination={destination} label="Google" mark="G" provider="google" source="google" />
        </div>
      ) : <p className="form-message error" role="alert">O acesso com o Google está temporariamente indisponível.</p>}
    </>
  );
}
