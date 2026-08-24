-- Change 049: keep the support triage helper deterministic and search-path safe.
create or replace function public.is_bug_report_admin()
returns boolean
language sql
stable
set search_path = pg_catalog, public, auth
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) in (
    'marioreis@id.uff.br',
    'sfranca@id.uff.br'
  );
$$;

revoke all on function public.is_bug_report_admin() from public, anon;
grant execute on function public.is_bug_report_admin() to authenticated;
