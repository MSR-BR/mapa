"use server";

import { redirect } from "next/navigation";

import { getAppUrl } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/server";

import type { AuthActionState } from "./types";
import {
  buildLoginErrorPath,
  getSocialAuthErrorCode,
  isSocialAuthProviderEnabled,
  readSafeAuthDestination,
  readSocialAuthProvider,
} from "./oauth-contract";
import { readEmail, readPassword } from "./validation";

const invalidCredentials: AuthActionState = {
  message: "Não foi possível entrar com os dados informados.",
  status: "error",
};

export async function login(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = readEmail(formData);
  const password = readPassword(formData);

  if (!email || !password) return invalidCredentials;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return invalidCredentials;
  redirect(readSafeAuthDestination(formData.get("next")));
}

export async function loginWithSocialProvider(formData: FormData) {
  const next = readSafeAuthDestination(formData.get("next"));
  const provider = readSocialAuthProvider(formData.get("provider"));

  if (!provider) redirect(buildLoginErrorPath("access", next));

  const errorCode = getSocialAuthErrorCode(provider);
  if (!isSocialAuthProviderEnabled(provider)) {
    redirect(buildLoginErrorPath(errorCode, next));
  }

  const supabase = await createClient();
  const result = await supabase.auth.signInWithOAuth({
    options: {
      redirectTo: `${getAppUrl()}/auth/callback?provider=${provider}&next=${encodeURIComponent(next)}`,
    },
    provider,
  }).catch(() => null);

  if (!result || result.error || !result.data.url) {
    redirect(buildLoginErrorPath(errorCode, next));
  }
  redirect(result.data.url);
}

export async function signUp(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = readEmail(formData);
  const password = readPassword(formData);

  if (!email || !password) {
    return {
      message: "Informe um e-mail válido e uma senha entre 8 e 128 caracteres.",
      status: "error",
    };
  }

  const supabase = await createClient();
  const next = readSafeAuthDestination(formData.get("next"));
  const { data, error } = await supabase.auth.signUp({
    email,
    options: { emailRedirectTo: `${getAppUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
    password,
  });

  if (error) {
    return {
      message: "Não foi possível concluir o cadastro. Tente novamente mais tarde.",
      status: "error",
    };
  }

  if (data.session) redirect(next);

  return {
    message: "Se o cadastro puder ser concluído, enviaremos uma confirmação por e-mail.",
    status: "success",
  };
}

export async function requestPasswordReset(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = readEmail(formData);

  if (email) {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getAppUrl()}/auth/confirm?type=recovery&next=/reset-password`,
    });
  }

  return {
    message: "Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.",
    status: "success",
  };
}

export async function updatePassword(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = readPassword(formData);

  if (!password) {
    return {
      message: "A senha deve ter entre 8 e 128 caracteres.",
      status: "error",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return {
      message: "O link expirou ou não é válido. Solicite uma nova recuperação.",
      status: "error",
    };
  }

  await supabase.auth.signOut();
  redirect("/login?password=updated");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
