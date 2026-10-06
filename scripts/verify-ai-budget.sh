#!/bin/sh
set -eu
container_name="mapa-c112-budget-check"
if docker container inspect "$container_name" >/dev/null 2>&1; then echo "Verificação C112 já em execução." >&2; exit 1; fi
cleanup() { docker stop "$container_name" >/dev/null 2>&1 || true; }
trap cleanup EXIT INT TERM
docker run --detach --rm --name "$container_name" --env POSTGRES_PASSWORD=mapa_c112_local_check --volume "$PWD:/workspace:ro" --volume "$PWD/scripts/verify-explicit-grants-stub.sql:/docker-entrypoint-initdb.d/000_stub.sql:ro" postgres:17-alpine >/dev/null
attempt=0
until docker exec "$container_name" pg_isready --username postgres >/dev/null 2>&1; do
  attempt=$((attempt+1)); if [ "$attempt" -ge 30 ]; then exit 1; fi; sleep 1
done
for migration in supabase/migrations/*.sql; do docker exec "$container_name" psql --username postgres --set ON_ERROR_STOP=1 --file "/workspace/$migration" >/dev/null; done
# Repeat only C112; no counters are reset by redeployment.
docker exec "$container_name" psql --username postgres --set ON_ERROR_STOP=1 --file /workspace/supabase/migrations/20261006214054_c112_ai_budget.sql >/dev/null
docker exec "$container_name" psql --username postgres --set ON_ERROR_STOP=1 --file /workspace/scripts/verify-ai-budget.sql >/dev/null
# 20 simultaneous requests compete for four remaining reservations.
seq 1 20 | xargs -P 8 -I {} docker exec "$container_name" psql --username postgres --set ON_ERROR_STOP=1 --quiet --tuples-only --command "set role authenticated; set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111'; select public.reserve_ai_budget('c112-synthetic-secret-at-least-32-characters',250);" >/dev/null
docker exec "$container_name" psql --username postgres --set ON_ERROR_STOP=1 --quiet --tuples-only --command "do \$\$ begin if not exists(select 1 from private.ai_budget_months where reserved_micros=1000 and attempts=4) then raise exception 'budget_race_failure'; end if; end \$\$;" >/dev/null
echo "C112_BUDGET_PASS: deny by default, secret+auth, private tables, idempotent migration, and concurrent hard cap."
