"use server";

import { redirect } from "next/navigation";

import { getAppUrl } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/server";

import {
  buildLoginErrorPath,
  getSocialAuthErrorCode,
  isSocialAuthProviderEnabled,
  readSafeAuthDestination,
  readSocialAuthProvider,
} from "./oauth-contract";

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

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
