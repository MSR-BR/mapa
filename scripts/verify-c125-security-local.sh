#!/bin/sh
set -eu
# Disposable PostgreSQL only. No Supabase CLI/API, credentials, host ports or network.
container_name="mapa-c125-security-local"
if docker container inspect "$container_name" >/dev/null 2>&1; then
  echo 'C125 test container already exists; refusing to reuse it.' >&2; exit 1
fi
cleanup() { docker stop "$container_name" >/dev/null 2>&1 || true; }
trap cleanup EXIT INT TERM
docker run --detach --rm --network none --name "$container_name" \
  --env POSTGRES_PASSWORD=c125_disposable_fixture \
  --volume "$PWD/supabase/migrations:/workspace/supabase/migrations:ro" \
  --volume "$PWD/scripts:/workspace/scripts:ro" \
  --volume "$PWD/scripts/verify-explicit-grants-stub.sql:/docker-entrypoint-initdb.d/000_stub.sql:ro" \
  postgres:17-alpine >/dev/null
attempt=0
until docker exec "$container_name" pg_isready --host 127.0.0.1 --username postgres >/dev/null 2>&1; do
  attempt=$((attempt+1)); if [ "$attempt" -ge 30 ]; then exit 1; fi; sleep 1
done
apply_sql() { docker exec "$container_name" psql -U postgres -v ON_ERROR_STOP=1 -f "/workspace/$1" >/dev/null; }
for migration in supabase/migrations/*.sql; do
  case "$migration" in
    *c125*) continue ;;
    *account_mode_database_foundation*) apply_sql scripts/verify-mode-aware-rls-seed.sql ;;
  esac
  apply_sql "$migration"
done
apply_sql scripts/verify-c125-security-seed.sql
# Each attempt runs in a rolled-back subtransaction; the same fixture is used twice.
docker exec "$container_name" psql -U postgres -qAt -v ON_ERROR_STOP=1 -v hardened=false -f /workspace/scripts/verify-c125-security.sql
for migration in supabase/migrations/*c125*.sql; do apply_sql "$migration"; done
docker exec "$container_name" psql -U postgres -qAt -v ON_ERROR_STOP=1 -v hardened=true -f /workspace/scripts/verify-c125-security.sql
docker exec "$container_name" psql -U postgres -qAt -v ON_ERROR_STOP=1 -f /workspace/scripts/verify-student-advisor-gate.sql
# Real catalog checks, including ACLs and private bucket metadata.
docker exec "$container_name" psql -U postgres -qAt -v ON_ERROR_STOP=1 -f /workspace/scripts/verify-explicit-grants.sql
echo 'c125_local_security_ok'
