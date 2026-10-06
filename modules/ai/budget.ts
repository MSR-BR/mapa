import "server-only";
import { createClient } from "@/lib/supabase/server";
import { AiError } from "./failure";

// This counter reserves the worst-case cost before each additional provider call.
// Reservations are never refunded: a timeout may already have incurred cost.
export async function reserveAdditionalAiBudget(micros: number) {
  const secret = process.env.MAPA_AI_BUDGET_SECRET;
  if (!secret) throw new AiError("configuration");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reserve_ai_budget", { p_secret: secret, p_micros: micros });
  if (error) throw new AiError("configuration");
  if (data !== true) throw new AiError("budget");
}
