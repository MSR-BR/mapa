import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  buildLoginErrorPath,
  getSocialAuthErrorCode,
  readSafeAuthDestination,
  readSocialAuthProvider,
} from "@/modules/auth/oauth-contract";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = readSafeAuthDestination(url.searchParams.get("next"), "/dashboard");
  const provider = readSocialAuthProvider(url.searchParams.get("provider"));

  if (code && provider === "google") {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }

  const errorCode = provider ? getSocialAuthErrorCode(provider) : "access";
  return NextResponse.redirect(new URL(buildLoginErrorPath(errorCode, next), url.origin));
}
