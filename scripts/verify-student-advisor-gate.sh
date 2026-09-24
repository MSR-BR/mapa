#!/bin/sh
set -eu

container_name="mapa-c89-student-advisor-gate"

if docker container inspect "$container_name" >/dev/null 2>&1; then
  echo "O contêiner de verificação da C89 já existe; interrompa-o antes de repetir." >&2
  exit 1
fi

cleanup() {
  docker stop "$container_name" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

docker run --detach --rm \
  --name "$container_name" \
  --env POSTGRES_PASSWORD=mapa_c89_local_check \
  --volume "$PWD:/workspace:ro" \
  --volume "$PWD/scripts/verify-mode-aware-rls-auth-stub.sql:/docker-entrypoint-initdb.d/000_auth_stub.sql:ro" \
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

apply_sql() {
  docker exec "$container_name" \
    psql \
    --username postgres \
    --set ON_ERROR_STOP=1 \
    --file "/workspace/$1" >/dev/null
}

apply_sql supabase/migrations/20260722013741_create_projects_foundation.sql
apply_sql supabase/migrations/20260723003616_create_generation_workspace.sql
apply_sql supabase/migrations/20260807225154_create_research_workflow_v2_foundation.sql
apply_sql supabase/migrations/20260807225429_index_research_workflow_project_owner.sql
apply_sql supabase/migrations/20260814203000_add_advisor_review_access.sql
apply_sql supabase/migrations/20260814214000_add_user_profiles_and_advisor_linking.sql
apply_sql supabase/migrations/20260818230000_harden_advisor_workflow_updates.sql
apply_sql supabase/migrations/20260819090000_add_legal_consents.sql
apply_sql supabase/migrations/20260819100000_add_profile_role_to_legal_consents.sql
apply_sql supabase/migrations/20260821142835_harden_security_definer_execute_grants.sql
apply_sql supabase/migrations/20260821153000_create_bug_reports.sql
apply_sql supabase/migrations/20260823120000_harden_bug_report_admin_search_path.sql
apply_sql supabase/migrations/20260911190000_lock_user_profile_role.sql
apply_sql scripts/verify-mode-aware-rls-seed.sql
apply_sql supabase/migrations/20260916163351_account_mode_database_foundation.sql
apply_sql supabase/migrations/20260917003926_c087_grant_switch_active_role.sql
apply_sql supabase/migrations/20260917003928_c087_harden_mode_aware_rls.sql
apply_sql supabase/migrations/20260917015508_c087_fix_project_insert_returning.sql
apply_sql supabase/migrations/20260919123000_c089_require_student_advisor_approval.sql
apply_sql supabase/migrations/20260924222657_c104_reduce_legacy_explicit_grants.sql

result="$(docker exec "$container_name" \
  psql \
  --username postgres \
  --quiet \
  --tuples-only \
  --no-align \
  --file /workspace/scripts/verify-student-advisor-gate.sql)"

if [ "$result" != "student_advisor_gate_ok" ]; then
  echo "Resultado inesperado na verificação da C89: $result" >&2
  exit 1
fi

echo "C104 validada em PostgreSQL 17 isolado: rascunho, bloqueio direto, revisão, aprovação, autonomia e grants mínimos aprovados."
