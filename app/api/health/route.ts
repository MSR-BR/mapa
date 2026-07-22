export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { service: "mapa-da-pesquisa", status: "ok" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
