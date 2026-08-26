const endpoint = "https://researchstarter.vercel.app/api/v1/reports";
const apiKey = process.env.RESEARCH_STARTER_MAPA_API_KEY || process.env.RESEARCH_STARTER_API_KEY;
if (!apiKey) throw new Error("RESEARCH_STARTER_MAPA_API_KEY não configurada.");

const response = await fetch(endpoint, {
  body: JSON.stringify({
    topic: "graphene batteries",
    publicationInterval: { kind: "last-5-years" },
    maxReferences: 3,
    maxTopPapers: 3,
    includeMarkdown: false,
  }),
  headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  method: "POST",
  signal: AbortSignal.timeout(45_000),
});
const payload = await response.json();
if (!response.ok || payload?.ok !== true) {
  throw new Error(`Research Starter falhou: HTTP ${response.status}; código ${payload?.code ?? "desconhecido"}.`);
}
if (!Array.isArray(payload.references) || !payload.summary?.overview) {
  throw new Error("Research Starter retornou um contrato inválido.");
}
console.log(`Research Starter validado: status=${payload.status}; referências=${payload.references.length}; confiança=${payload.confidenceLevel}.`);
