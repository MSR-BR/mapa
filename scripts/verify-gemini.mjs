import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY não configurada.");

const google = createGoogleGenerativeAI({ apiKey });
const { output } = await generateText({
  maxOutputTokens: 512,
  model: google("gemini-2.5-flash"),
  output: Output.object({
    schema: z.object({
      chapterCount: z.number().int(),
      schemaVersion: z.string(),
    }),
  }),
  prompt: "Retorne chapterCount igual a 5 e schemaVersion igual a 1.0.0.",
  providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } },
  temperature: 0,
});

if (output.chapterCount !== 5 || output.schemaVersion !== "1.0.0") {
  throw new Error("Gemini não respeitou o contrato estruturado mínimo.");
}
console.log("Gemini validado: saída estruturada compatível com o schema 1.0.0.");
