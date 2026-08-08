type Claims = {
  email?: unknown;
};

export function isResearchMapV2EnabledForClaims(claims: Claims) {
  const rollout = (process.env.MAPA_V2_ROLLOUT ?? "enabled").trim().toLocaleLowerCase("pt-BR");
  if (["0", "false", "off", "disabled"].includes(rollout)) return false;
  if (rollout !== "admin_only") return true;

  const email = typeof claims.email === "string" ? claims.email.toLocaleLowerCase("pt-BR") : "";
  const allowed = (process.env.MAPA_V2_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLocaleLowerCase("pt-BR"))
    .filter(Boolean);

  return Boolean(email && allowed.includes(email));
}
