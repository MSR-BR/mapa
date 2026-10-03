/** Keep custom Proxy request headers aligned with a refreshed SSR session. */
export function forwardRefreshedCookieHeader(source: Headers, destination: Headers) {
  const cookieHeader = source.get("cookie");
  if (cookieHeader === null) destination.delete("cookie");
  else destination.set("cookie", cookieHeader);
}

/** Prevent a response carrying a new auth cookie from being cached. */
export function applySessionResponseHeaders(
  source: Record<string, string> | undefined,
  destination: Headers,
) {
  Object.entries(source ?? {}).forEach(([name, value]) => destination.set(name, value));
}
