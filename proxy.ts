import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

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

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
