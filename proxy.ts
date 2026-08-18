import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

function createNonce() {
  return btoa(crypto.randomUUID());
}

function buildContentSecurityPolicy(nonce: string) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://www.google-analytics.com`,
    "connect-src 'self' https://aeaweherkrqmlqnxsmib.supabase.co https://www.google-analytics.com https://analytics.google.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const hostname = request.nextUrl.hostname;
  if (hostname === "mapadapesquisa.vercel.app" || hostname.endsWith("mapadapesquisa.vercel.app")) {
    const canonical = new URL(request.nextUrl.pathname + request.nextUrl.search, "https://mapadapesquisa.com.br");
    return NextResponse.redirect(canonical, 308);
  }

  // Browser requests include Origin on mutating fetches. Reject an explicit
  // cross-origin origin before Supabase cookies are consulted; requests that
  // omit Origin remain compatible with server-to-server health checks.
  if (
    request.nextUrl.pathname.startsWith("/api/")
    && ["POST", "PUT", "PATCH", "DELETE"].includes(request.method)
  ) {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
    }
  }

  if (process.env.NODE_ENV !== "production") return updateSession(request);

  const nonce = createNonce();
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);
  const response = await updateSession(request, requestHeaders);
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
