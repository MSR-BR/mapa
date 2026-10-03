import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabasePublicConfig } from "./config";
import type { Database } from "./database.types";
import { applySessionResponseHeaders, forwardRefreshedCookieHeader } from "./proxy-headers";

export async function updateSession(request: NextRequest, requestHeaders?: Headers) {
  const nextRequest = requestHeaders ? { headers: requestHeaders } : request;
  let response = NextResponse.next({ request: nextRequest });
  const { publishableKey, url } = getSupabasePublicConfig();
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        // NextResponse uses the cloned headers in production. Keep their Cookie
        // header in sync so Server Components see the token refreshed above.
        if (requestHeaders) forwardRefreshedCookieHeader(request.headers, requestHeaders);
        response = NextResponse.next({ request: nextRequest });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        applySessionResponseHeaders(headers, response.headers);
      },
    },
  });

  await supabase.auth.getClaims();
  return response;
}
