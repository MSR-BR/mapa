-- C036/C039: SECURITY DEFINER functions must not be callable anonymously.
-- The two application RPCs are intentionally available only to signed-in users;
-- the trigger function is invoked by PostgreSQL and has no API grant.

revoke all on function public.set_project_advisor(uuid, text) from public, anon, authenticated;
grant execute on function public.set_project_advisor(uuid, text) to authenticated;

revoke all on function public.claim_pending_advisor_projects() from public, anon, authenticated;
grant execute on function public.claim_pending_advisor_projects() to authenticated;

revoke all on function public.restrict_advisor_workflow_update() from public, anon, authenticated;
