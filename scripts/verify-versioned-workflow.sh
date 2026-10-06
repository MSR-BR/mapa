#!/bin/sh
set -eu
container_name="mapa-c111-history-check"
if docker container inspect "$container_name" >/dev/null 2>&1; then echo "Verificação C111 já em execução." >&2; exit 1; fi
cleanup() { docker stop "$container_name" >/dev/null 2>&1 || true; }
trap cleanup EXIT INT TERM
node --import tsx scripts/seed-versioned-workflow.ts
docker run --detach --rm --name "$container_name" --env POSTGRES_PASSWORD=mapa_c111_local_check --volume "$PWD:/workspace:ro" --volume "$PWD/scripts/verify-explicit-grants-stub.sql:/docker-entrypoint-initdb.d/000_stub.sql:ro" postgres:17-alpine >/dev/null
attempt=0
until docker exec "$container_name" pg_isready --username postgres >/dev/null 2>&1; do
  attempt=$((attempt+1)); if [ "$attempt" -ge 30 ]; then exit 1; fi; sleep 1
done
apply_sql() { docker exec "$container_name" psql --username postgres --set ON_ERROR_STOP=1 --file "/workspace/$1" >/dev/null; }
for migration in supabase/migrations/*.sql; do
  case "$migration" in *c111*) apply_sql tmp/c111-history-seed.sql ;; esac
  apply_sql "$migration"
done
# Repeat the migration to prove idempotence on migrated content and legacy rows.
apply_sql supabase/migrations/20261006191733_c111_versioned_workflow_history.sql
docker exec "$container_name" psql --username postgres --quiet --tuples-only --no-align --set ON_ERROR_STOP=1 --file /workspace/scripts/verify-versioned-workflow.sql
