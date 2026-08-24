import { APP_VERSION } from "@/lib/app-version";
import {
  attachRequestId,
  elapsedMs,
  logOperationalEvent,
  startRequest,
} from "@/lib/observability/request-context";
import { getProviderHealth } from "@/lib/observability/provider-health";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const context = startRequest(request);
  const checks = getProviderHealth();
  const status = checks.supabase === "configured"
    ? Object.values(checks).every((value) => value === "configured") ? "ok" : "degraded"
    : "down";
  const response = Response.json(
    {
      checks,
      service: "mapa-da-pesquisa",
      status,
      version: APP_VERSION,
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Health-Status": status,
      },
      status: status === "down" ? 503 : 200,
    },
  );
  attachRequestId(response, context.requestId);
  logOperationalEvent("health_check_completed", context, {
    durationMs: elapsedMs(context),
    status,
  });
  return response;
}
