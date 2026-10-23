import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readOperationalEvents, summarizeAiCapacity } from "./report-ai-capacity.mjs";

/** Comparative telemetry alone cannot establish academic quality. No automatic model switch. */
export function evaluateAiRouting(report, reviewedFixtures = []) {
  const operations = {};
  for (const [key, bucket] of Object.entries(report.providerOperations)) {
    const [provider, operation] = key.split("/");
    const record = operations[operation] ?? { gemini: null, openai: null, decision: "retain_current_routing" };
    operations[operation] = record;
    const reviewed = reviewedFixtures.filter(item => item.operation === operation && item.provider === provider && typeof item.passed === "boolean");
    record[provider] = {
      attempts: bucket.attempts,
      successRate: bucket.attempts ? Number((bucket.succeeded / bucket.attempts).toFixed(3)) : null,
      averageDurationMs: bucket.timedAttempts ? Math.round(bucket.measuredDurationMs / bucket.timedAttempts) : null,
      estimatedKnownUsd: bucket.estimatedKnownUsd,
      unpricedAttempts: bucket.unpricedAttempts,
      academicallyReviewed: reviewed.length,
      reviewedPassRate: reviewed.length ? Number((reviewed.filter(item => item.passed).length / reviewed.length).toFixed(3)) : null,
    };
  }
  for (const item of Object.values(operations)) {
    item.reason = item.gemini && item.openai && item.gemini.academicallyReviewed > 0 && item.openai.academicallyReviewed > 0
      ? "Comparação registrada; qualquer mudança de rota exige decisão revisada por operação."
      : "Falta comparação acadêmica dos dois provedores para esta operação.";
  }
  return { operations, appliedModelChanges: 0, note: "Avaliação somente. Não distribui chamadas artificialmente nem troca modelo sem qualidade validada." };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const path = process.argv[2];
  if (!path) {
    process.stderr.write("Uso: node scripts/evaluate-ai-routing.mjs log-sanitizado.ndjson [avaliacao-academica.json]\n");
    process.exitCode = 2;
  } else {
    const report = summarizeAiCapacity(readOperationalEvents(readFileSync(path, "utf8")));
    const reviewed = process.argv[3] ? JSON.parse(readFileSync(process.argv[3], "utf8")) : [];
    process.stdout.write(`${JSON.stringify(evaluateAiRouting(report, Array.isArray(reviewed) ? reviewed : []), null, 2)}\n`);
  }
}
