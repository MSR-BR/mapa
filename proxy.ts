import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const hostname = request.nextUrl.hostname;
  if (hostname === "mapadapesquisa.vercel.app" || hostname.endsWith("mapadapesquisa.vercel.app")) {
    const canonical = new URL(request.nextUrl.pathname + request.nextUrl.search, "https://mapadapesquisa.com.br");
    return NextResponse.redirect(canonical, 308);
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
