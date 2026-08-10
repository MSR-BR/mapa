"use server";

import { redirect } from "next/navigation";

import { getAppUrl } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/server";

import type { AuthActionState } from "./types";
import { readEmail, readPassword } from "./validation";

const invalidCredentials: AuthActionState = {
  message: "Não foi possível entrar com os dados informados.",
  status: "error",
};

function readSafeDestination(formData: FormData) {
  const value = formData.get("next");
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/dashboard?continue=1";
}

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
  redirect(readSafeDestination(formData));
}

export async function loginWithGoogle(formData: FormData) {
  const next = readSafeDestination(formData);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    options: {
      redirectTo: `${getAppUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
    provider: "google",
  });

  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
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
  const { data, error } = await supabase.auth.signUp({
    email,
    options: { emailRedirectTo: `${getAppUrl()}/auth/callback?next=${encodeURIComponent("/dashboard?continue=1")}` },
    password,
  });

  if (error) {
    return {
      message: "Não foi possível concluir o cadastro. Tente novamente mais tarde.",
      status: "error",
    };
  }

  if (data.session) redirect("/dashboard?continue=1");

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
      redirectTo: `${getAppUrl()}/auth/callback?next=/reset-password`,
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
