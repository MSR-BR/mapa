#!/bin/sh
set -eu

container_name="mapa-c85-account-mode-check"

if docker container inspect "$container_name" >/dev/null 2>&1; then
  echo "O contêiner de verificação da C85 já existe; interrompa-o antes de repetir." >&2
  exit 1
fi

cleanup() {
  docker stop "$container_name" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

docker run --detach --rm \
  --name "$container_name" \
  --env POSTGRES_PASSWORD=mapa_c85_local_check \
  --volume "$PWD/scripts/verify-account-mode-foundation-fixture.sql:/docker-entrypoint-initdb.d/000_fixture.sql:ro" \
  --volume "$PWD/supabase/migrations/20260916163351_account_mode_database_foundation.sql:/docker-entrypoint-initdb.d/100_c083.sql:ro" \
  --volume "$PWD/scripts/verify-account-mode-foundation.sql:/verification/verify-c083.sql:ro" \
  --volume "$PWD/scripts/verify-account-mode-settings.sql:/verification/verify-c085.sql:ro" \
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

foundation_result="$(docker exec "$container_name" \
  psql \
  --username postgres \
  --tuples-only \
  --no-align \
  --file /verification/verify-c083.sql)"

if [ "$foundation_result" != "DO
account_mode_foundation_ok" ]; then
  echo "Resultado inesperado na base da C83: $foundation_result" >&2
  exit 1
fi

settings_result="$(docker exec "$container_name" \
  psql \
  --username postgres \
  --tuples-only \
  --no-align \
  --file /verification/verify-c085.sql)"

if [ "$settings_result" != "DO
account_mode_settings_ok" ]; then
  echo "Resultado inesperado na verificação da C85: $settings_result" >&2
  exit 1
fi

echo "C85 validada em PostgreSQL 17 isolado: A→O, O→A, replay idempotente, conflito e autoria preservada."
