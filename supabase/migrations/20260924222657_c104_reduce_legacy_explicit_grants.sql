-- C104: remove privilégios legados excedentes preservados pelos defaults
-- antigos do Supabase. RLS continua sendo a segunda camada de autorização.

revoke all privileges on table
  public.projects,
  public.generation_jobs,
  public.research_structures,
  public.research_workflows,
  public.user_profiles,
  public.legal_consents,
  public.bug_reports,
  public.user_profile_role_events
from public, anon, authenticated, service_role;

grant select, insert, delete on table public.projects to authenticated;
grant update (
  academic_level,
  deleted_at,
  keywords,
  knowledge_area,
  problem_statement,
  status,
  theme,
  title,
  updated_at,
  workflow_version
) on table public.projects to authenticated;

grant select, insert, update, delete on table
  public.generation_jobs,
  public.research_structures,
  public.research_workflows
to authenticated;

grant select, insert on table public.user_profiles to authenticated;
grant select, insert, update on table public.legal_consents to authenticated;
grant insert on table public.bug_reports to anon;
grant select, insert, update on table public.bug_reports to authenticated;
grant select on table public.user_profile_role_events to service_role;

revoke all on schema private from public, anon, service_role;
grant usage on schema private to authenticated;

revoke all on function public.set_project_advisor(uuid, text)
  from public, anon, authenticated, service_role;
revoke all on function public.claim_pending_advisor_projects()
  from public, anon, authenticated, service_role;
revoke all on function public.switch_active_role(text, bigint, uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.is_bug_report_admin()
  from public, anon, authenticated, service_role;
revoke all on function public.enforce_user_profile_role_version()
  from public, anon, authenticated, service_role;
revoke all on function public.audit_user_profile_role_change()
  from public, anon, authenticated, service_role;
revoke all on function public.enforce_project_authoring_role()
  from public, anon, authenticated, service_role;
revoke all on function public.restrict_advisor_workflow_update()
  from public, anon, authenticated, service_role;
revoke all on function public.enforce_student_advisor_workflow_progress()
  from public, anon, authenticated, service_role;
revoke all on function private.current_active_role()
  from public, anon, authenticated, service_role;
revoke all on function private.project_owned_in_active_mode(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke all on function private.project_reviewable_by_active_advisor(uuid, uuid)
  from public, anon, authenticated, service_role;

grant execute on function public.set_project_advisor(uuid, text)
  to authenticated;
grant execute on function public.claim_pending_advisor_projects()
  to authenticated;
grant execute on function public.switch_active_role(text, bigint, uuid)
  to authenticated;
grant execute on function public.is_bug_report_admin()
  to authenticated;
grant execute on function private.current_active_role()
  to authenticated;
grant execute on function private.project_owned_in_active_mode(uuid, uuid)
  to authenticated;
grant execute on function private.project_reviewable_by_active_advisor(uuid, uuid)
  to authenticated;

-- A opção de revogar privilégios padrão de objetos futuros permanece separada.
-- A plataforma fará essa mudança em 30/10/2026; esta migration limita somente
-- objetos existentes e não antecipa uma configuração global sem aprovação.
