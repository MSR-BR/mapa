import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY não configurada.");
const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";

const google = createGoogleGenerativeAI({ apiKey });
const { output } = await generateText({
  maxOutputTokens: 512,
  model: google(model),
  output: Output.object({
    schema: z.object({
      chapterCount: z.number().int(),
      schemaVersion: z.string(),
    }),
  }),
  prompt: "Retorne chapterCount igual a 5 e schemaVersion igual a 1.0.0.",
  // Only the validated 3.6 model uses minimal; 3.8 rejects this level.
  providerOptions: model === "gemini-3.6-flash"
    ? { google: { thinkingConfig: { thinkingLevel: "minimal" } } }
    : undefined,
  // Keep legacy 2.5 sampling unchanged; newer models deprecate these controls.
  ...(model.startsWith("gemini-2.5-") ? { temperature: 0 } : {}),
});

if (output.chapterCount !== 5 || output.schemaVersion !== "1.0.0") {
  throw new Error("Gemini não respeitou o contrato estruturado mínimo.");
}
console.log(`Gemini validado: modelo=${model}; saída estruturada compatível com o schema 1.0.0.`);
