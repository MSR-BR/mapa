#!/bin/sh
set -eu

container_name="mapa-c103-explicit-grants-check"

if docker container inspect "$container_name" >/dev/null 2>&1; then
  echo "O contêiner de verificação da C103 já existe; interrompa-o antes de repetir." >&2
  exit 1
fi

cleanup() {
  docker stop "$container_name" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

docker run --detach --rm \
  --name "$container_name" \
  --env POSTGRES_PASSWORD=mapa_c103_local_check \
  --volume "$PWD:/workspace:ro" \
  --volume "$PWD/scripts/verify-explicit-grants-stub.sql:/docker-entrypoint-initdb.d/000_platform_stub.sql:ro" \
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

for migration in supabase/migrations/*.sql; do
  docker exec "$container_name" \
    psql \
    --username postgres \
    --set ON_ERROR_STOP=1 \
    --file "/workspace/$migration" >/dev/null
done

result="$(docker exec "$container_name" \
  psql \
  --username postgres \
  --quiet \
  --tuples-only \
  --no-align \
  --file /workspace/scripts/verify-explicit-grants.sql)"

if [ "$result" != "explicit_grants_ok" ]; then
  echo "Resultado inesperado na verificação da C103: $result" >&2
  exit 1
fi

echo "C104 validada em PostgreSQL 17 isolado: 19 migrations, grants mínimos, RLS, funções, policies e ausência de sequences aprovados."
