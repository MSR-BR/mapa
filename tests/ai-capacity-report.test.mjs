import assert from "node:assert/strict";
import test from "node:test";
import { readOperationalEvents, summarizeAiCapacity } from "../scripts/report-ai-capacity.mjs";
import { evaluateAiRouting } from "../scripts/evaluate-ai-routing.mjs";

test("C134: reports attempts and known estimated cost without copying academic text or counting maps", () => {
  const events = readOperationalEvents([
    JSON.stringify({ event: "gemini_generation_completed", provider: "gemini", operation: "generate_general_objective", estimatedCostUsd: 0.003001, prompt: "PRIVATE_TEXT", projectId: "PRIVATE_ID" }),
    JSON.stringify({ event: "openai_generation_failed", provider: "openai", operation: "review_final_map_coherence", estimatedCostUsd: null, errorCode: "rate_limited", responseBody: "PRIVATE_ERROR" }),
    JSON.stringify({ event: "ai_budget_pressure", thresholdPercent: 80 }),
    "malformed line",
  ].join("\n"));
  const report = summarizeAiCapacity(events);
  assert.equal(report.attempts, 2);
  assert.equal(report.estimatedKnownUsd, 0.003001);
  assert.equal(report.unpricedAttempts, 1);
  assert.equal(report.failures.rate_limited, 1);
  assert.equal(report.warnings.ai_budget_pressure_80, 1);
  assert.equal(report.completedMaps, null);
  assert.doesNotMatch(JSON.stringify(report), /PRIVATE_/);
});

test("C131: cost and success telemetry do not trigger an unreviewed provider switch", () => {
  const report = summarizeAiCapacity([
    { event: "gemini_generation_completed", provider: "gemini", operation: "generate_general_objective", estimatedCostUsd: 0.1, durationMs: 100 },
    { event: "openai_generation_completed", provider: "openai", operation: "generate_general_objective", estimatedCostUsd: 0.01, durationMs: 10 },
  ]);
  const evaluation = evaluateAiRouting(report);
  assert.equal(evaluation.appliedModelChanges, 0);
  assert.equal(evaluation.operations.generate_general_objective.decision, "retain_current_routing");
  assert.match(evaluation.operations.generate_general_objective.reason, /acadêmica/);
  assert.equal(evaluation.operations.generate_general_objective.openai.averageDurationMs, 10);
});
