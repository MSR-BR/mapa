#!/bin/sh
set -eu

container_name="mapa-c02-migration-check"

if docker container inspect "$container_name" >/dev/null 2>&1; then
  echo "O contêiner de verificação já existe; interrompa-o antes de repetir." >&2
  exit 1
fi

cleanup() {
  docker stop "$container_name" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

docker run --detach --rm \
  --name "$container_name" \
  --env POSTGRES_PASSWORD=mapa_local_check \
  --volume "$PWD/scripts/verify-migration-auth-stub.sql:/docker-entrypoint-initdb.d/000_auth_stub.sql:ro" \
  --volume "$PWD/supabase/migrations/20260722013741_create_projects_foundation.sql:/docker-entrypoint-initdb.d/100_projects.sql:ro" \
  postgres:17-alpine >/dev/null

attempt=0
until docker exec "$container_name" pg_isready --username postgres >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    docker logs "$container_name" >&2
    exit 1
  fi
  sleep 1
done

result="$(docker exec "$container_name" psql --username postgres --tuples-only --no-align --command "
  select
    (select count(*) from pg_tables where schemaname = 'public' and tablename = 'projects'),
    (select count(*) from pg_policies where schemaname = 'public' and tablename = 'projects'),
    (select count(*) from pg_indexes where schemaname = 'public' and tablename = 'projects' and indexname = 'projects_owner_updated_at_idx');
")"

if [ "$result" != "1|4|1" ]; then
  echo "Estrutura inesperada após migração: $result" >&2
  exit 1
fi

echo "Migração validada em PostgreSQL vazio: tabela, quatro políticas e índice confirmados."
