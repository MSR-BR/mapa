export function getAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!configuredUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL não está configurada.");
  }

  const url = new URL(configuredUrl);
  const isLocalhost = url.protocol === "http:" && url.hostname === "localhost";

  if (url.protocol !== "https:" && !isLocalhost) {
    throw new Error("A URL da aplicação deve usar HTTPS fora do localhost.");
  }

  return url.origin;
}
