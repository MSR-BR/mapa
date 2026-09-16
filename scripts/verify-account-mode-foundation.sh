#!/bin/sh
set -eu

container_name="mapa-c83-account-mode-check"

if docker container inspect "$container_name" >/dev/null 2>&1; then
  echo "O contêiner de verificação da C83 já existe; interrompa-o antes de repetir." >&2
  exit 1
fi

cleanup() {
  docker stop "$container_name" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

docker run --detach --rm \
  --name "$container_name" \
  --env POSTGRES_PASSWORD=mapa_c83_local_check \
  --volume "$PWD/scripts/verify-account-mode-foundation-fixture.sql:/docker-entrypoint-initdb.d/000_fixture.sql:ro" \
  --volume "$PWD/supabase/migrations/20260916163351_account_mode_database_foundation.sql:/docker-entrypoint-initdb.d/100_c083.sql:ro" \
  --volume "$PWD/scripts/verify-account-mode-foundation.sql:/verification/verify.sql:ro" \
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

result="$(docker exec "$container_name" \
  psql \
  --username postgres \
  --tuples-only \
  --no-align \
  --file /verification/verify.sql)"

if [ "$result" != "DO
account_mode_foundation_ok" ]; then
  echo "Resultado inesperado na verificação da C83: $result" >&2
  exit 1
fi

docker exec "$container_name" createdb --username postgres mapa_c83_invalid

docker exec "$container_name" \
  psql \
  --username postgres \
  --dbname mapa_c83_invalid \
  --set ON_ERROR_STOP=1 \
  --file /docker-entrypoint-initdb.d/000_fixture.sql >/dev/null

docker exec "$container_name" \
  psql \
  --username postgres \
  --dbname mapa_c83_invalid \
  --set ON_ERROR_STOP=1 \
  --command "update public.projects
    set advisor_id = owner_id,
        advisor_email = 'student@example.invalid'
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';" >/dev/null

if docker exec "$container_name" \
  psql \
  --username postgres \
  --dbname mapa_c83_invalid \
  --set ON_ERROR_STOP=1 \
  --file /docker-entrypoint-initdb.d/100_c083.sql >/dev/null 2>&1
then
  echo "A migration aceitou auto-orientação em projeto de aluno." >&2
  exit 1
fi

rollback_result="$(docker exec "$container_name" \
  psql \
  --username postgres \
  --dbname mapa_c83_invalid \
  --tuples-only \
  --no-align \
  --command "
    select
      (select count(*) from information_schema.columns
        where table_schema = 'public'
          and table_name = 'user_profiles'
          and column_name = 'role_version'),
      (select count(*) from pg_tables
        where schemaname = 'public'
          and tablename = 'user_profile_role_events'),
      (select count(*) from information_schema.columns
        where table_schema = 'public'
          and table_name = 'projects'
          and column_name = 'authoring_role');
  ")"

if [ "$rollback_result" != "0|0|0" ]; then
  echo "A migration inválida não foi revertida integralmente: $rollback_result" >&2
  exit 1
fi

echo "C83 validada em PostgreSQL 17 isolado: backfill, autoria, auditoria, RPC e grants aprovados."
