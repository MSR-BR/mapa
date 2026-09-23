export const SOCIAL_AUTH_PROVIDERS = {
  google: {
    errorCode: "google",
    flagName: "GOOGLE_AUTH_ENABLED",
    label: "Google",
  },
  linkedin_oidc: {
    errorCode: "linkedin",
    flagName: "LINKEDIN_AUTH_ENABLED",
    label: "LinkedIn",
  },
} as const;

export type SocialAuthProvider = keyof typeof SOCIAL_AUTH_PROVIDERS;
export type SocialAuthErrorCode =
  | (typeof SOCIAL_AUTH_PROVIDERS)[SocialAuthProvider]["errorCode"]
  | "access";

type SocialAuthEnvironment = Partial<
  Record<(typeof SOCIAL_AUTH_PROVIDERS)[SocialAuthProvider]["flagName"], string | undefined>
>;

export function readSocialAuthProvider(value: unknown): SocialAuthProvider | null {
  return typeof value === "string" && Object.hasOwn(SOCIAL_AUTH_PROVIDERS, value)
    ? value as SocialAuthProvider
    : null;
}

export function isSocialAuthProviderEnabled(
  provider: SocialAuthProvider,
  environment?: SocialAuthEnvironment,
) {
  const values = environment ?? {
    GOOGLE_AUTH_ENABLED: process.env.GOOGLE_AUTH_ENABLED,
    LINKEDIN_AUTH_ENABLED: process.env.LINKEDIN_AUTH_ENABLED,
  };
  return values[SOCIAL_AUTH_PROVIDERS[provider].flagName] === "true";
}

export function getSocialAuthErrorCode(provider: SocialAuthProvider): SocialAuthErrorCode {
  return SOCIAL_AUTH_PROVIDERS[provider].errorCode;
}

export function readSocialAuthErrorCode(value: unknown): SocialAuthErrorCode | null {
  return value === "google" || value === "linkedin" || value === "access"
    ? value
    : null;
}

export function readSafeAuthDestination(
  value: unknown,
  fallback = "/dashboard?continue=1",
) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  if (value.includes("\\") || /[\r\n]/u.test(value)) return fallback;

  try {
    const baseUrl = new URL("https://mapa.invalid");
    const destination = new URL(value, baseUrl);
    return destination.origin === baseUrl.origin ? value : fallback;
  } catch {
    return fallback;
  }
}

export function buildLoginErrorPath(
  errorCode: SocialAuthErrorCode,
  destination: string,
) {
  return `/login?error=${errorCode}&next=${encodeURIComponent(destination)}`;
}
