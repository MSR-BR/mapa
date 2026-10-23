import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const providers = new Set(["gemini", "openai"]);
const usageEvents = new Set(["gemini_generation_completed", "gemini_generation_failed", "openai_generation_completed", "openai_generation_failed"]);
const warningEvents = new Set(["ai_budget_pressure", "ai_budget_estimate_exceeded", "ai_budget_settlement_pending"]);

/** Aggregate allowlisted operational fields; private academic text never enters the report. */
export function summarizeAiCapacity(events) {
  const report = {
    attempts: 0, succeeded: 0, failed: 0, estimatedKnownUsd: 0,
    unpricedAttempts: 0, providerOperations: {}, failures: {}, warnings: {},
    scope: "AI attempts in the supplied log only; no unique students, projects or completed maps",
    costPerCompletedMapUsd: null, completedMaps: null,
  };
  let micros = 0;
  for (const item of events) {
    if (!item || typeof item !== "object") continue;
    if (warningEvents.has(item.event)) {
      const key = item.event === "ai_budget_pressure" && [80, 95].includes(item.thresholdPercent)
        ? `${item.event}_${item.thresholdPercent}` : item.event;
      report.warnings[key] = (report.warnings[key] ?? 0) + 1;
      continue;
    }
    if (!usageEvents.has(item.event) || !providers.has(item.provider) ||
      !/^[a-z_]{1,80}$/.test(item.operation ?? "")) continue;
    const key = `${item.provider}/${item.operation}`;
    const bucket = report.providerOperations[key] ?? { attempts: 0, succeeded: 0, failed: 0, estimatedKnownUsd: 0, unpricedAttempts: 0, measuredDurationMs: 0, timedAttempts: 0 };
    report.providerOperations[key] = bucket;
    const failed = item.event.endsWith("_failed");
    report.attempts++; bucket.attempts++;
    if (Number.isFinite(item.durationMs) && item.durationMs >= 0 && item.durationMs <= 300_000) {
      bucket.measuredDurationMs += item.durationMs;
      bucket.timedAttempts++;
    }
    if (failed) {
      report.failed++; bucket.failed++;
      const reason = /^[a-z_]{1,60}$/.test(item.errorCode ?? "") ? item.errorCode : "unknown";
      report.failures[reason] = (report.failures[reason] ?? 0) + 1;
    } else { report.succeeded++; bucket.succeeded++; }
    const cost = item.estimatedCostUsd;
    if (typeof cost === "number" && Number.isFinite(cost) && cost >= 0 && cost <= 1000) {
      const costMicros = Math.round(cost * 1_000_000);
      micros += costMicros;
      bucket.estimatedKnownUsd = Number((bucket.estimatedKnownUsd + costMicros / 1_000_000).toFixed(6));
    } else { report.unpricedAttempts++; bucket.unpricedAttempts++; }
  }
  report.estimatedKnownUsd = Number((micros / 1_000_000).toFixed(6));
  return report;
}

export function readOperationalEvents(text) {
  return text.split(/\r?\n/).flatMap((line) => {
    const start = line.indexOf("{");
    if (start < 0) return [];
    try { return [JSON.parse(line.slice(start))]; } catch { return []; }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const path = process.argv[2];
  if (!path) {
    process.stderr.write("Uso: node scripts/report-ai-capacity.mjs caminho/para/log-sanitizado.ndjson\n");
    process.exitCode = 2;
  } else {
    const report = summarizeAiCapacity(readOperationalEvents(readFileSync(path, "utf8")));
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  }
}
