import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import {
  buildLoginErrorPath,
  getSocialAuthErrorCode,
  readSafeAuthDestination,
  readSocialAuthProvider,
} from "@/modules/auth/oauth-contract";

const recoveryTypes = new Set<EmailOtpType>(["email", "invite", "magiclink", "recovery", "signup"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = readSafeAuthDestination(url.searchParams.get("next"), "/dashboard");
  const provider = readSocialAuthProvider(url.searchParams.get("provider"));

  if (tokenHash && type && recoveryTypes.has(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      return NextResponse.redirect(new URL(type === "recovery" ? "/reset-password" : next, url.origin));
    }
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }

  const errorCode = provider ? getSocialAuthErrorCode(provider) : "access";
  return NextResponse.redirect(new URL(buildLoginErrorPath(errorCode, next), url.origin));
}
