\set ON_ERROR_STOP on

do $$
declare
  table_name text;
  function_signature text;
begin
  if (
    select count(*)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and c.relname in (
        'projects', 'generation_jobs', 'research_structures',
        'research_workflows', 'user_profiles', 'legal_consents',
        'bug_reports', 'user_profile_role_events'
      )
  ) <> 8 then
    raise exception 'owned_public_table_inventory_mismatch';
  end if;

  foreach table_name in array array[
    'projects', 'generation_jobs', 'research_structures',
    'research_workflows', 'user_profiles', 'legal_consents',
    'bug_reports', 'user_profile_role_events'
  ] loop
    if not exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = table_name
        and c.relrowsecurity
    ) then
      raise exception 'rls_not_enabled:%', table_name;
    end if;
  end loop;

  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('S', 'v', 'm')
  ) then
    raise exception 'unexpected_public_view_or_sequence';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and column_default ilike 'nextval(%'
  ) then
    raise exception 'implicit_sequence_detected';
  end if;

  if has_table_privilege('anon', 'public.projects', 'SELECT,INSERT,UPDATE,DELETE') then
    raise exception 'anon_projects_privilege';
  end if;
  if not has_table_privilege('authenticated', 'public.projects', 'SELECT,INSERT,DELETE')
    or not has_any_column_privilege('authenticated', 'public.projects', 'UPDATE')
    or has_column_privilege('authenticated', 'public.projects', 'advisor_id', 'UPDATE')
    or has_column_privilege('authenticated', 'public.projects', 'authoring_role', 'UPDATE')
  then
    raise exception 'authenticated_projects_privilege_mismatch';
  end if;

  foreach table_name in array array[
    'generation_jobs', 'research_structures', 'research_workflows'
  ] loop
    if has_table_privilege('anon', format('public.%I', table_name), 'SELECT,INSERT,UPDATE,DELETE')
      or not has_table_privilege('authenticated', format('public.%I', table_name), 'SELECT,INSERT,UPDATE,DELETE')
    then
      raise exception 'owned_resource_privilege_mismatch:%', table_name;
    end if;
  end loop;

  if has_table_privilege('anon', 'public.user_profiles', 'SELECT,INSERT,UPDATE,DELETE')
    or not has_table_privilege('authenticated', 'public.user_profiles', 'SELECT,INSERT')
    or has_table_privilege('authenticated', 'public.user_profiles', 'UPDATE,DELETE')
  then
    raise exception 'user_profiles_privilege_mismatch';
  end if;

  if has_table_privilege('anon', 'public.legal_consents', 'SELECT,INSERT,UPDATE,DELETE')
    or not has_table_privilege('authenticated', 'public.legal_consents', 'SELECT,INSERT,UPDATE')
    or has_table_privilege('authenticated', 'public.legal_consents', 'DELETE')
  then
    raise exception 'legal_consents_privilege_mismatch';
  end if;

  if not has_table_privilege('anon', 'public.bug_reports', 'INSERT')
    or has_table_privilege('anon', 'public.bug_reports', 'SELECT,UPDATE,DELETE')
    or not has_table_privilege('authenticated', 'public.bug_reports', 'SELECT,INSERT,UPDATE')
    or has_table_privilege('authenticated', 'public.bug_reports', 'DELETE')
  then
    raise exception 'bug_reports_privilege_mismatch';
  end if;

  if has_table_privilege('anon', 'public.user_profile_role_events', 'SELECT,INSERT,UPDATE,DELETE')
    or has_table_privilege('authenticated', 'public.user_profile_role_events', 'SELECT,INSERT,UPDATE,DELETE')
    or not has_table_privilege('service_role', 'public.user_profile_role_events', 'SELECT')
  then
    raise exception 'role_events_privilege_mismatch';
  end if;

  foreach function_signature in array array[
    'public.set_project_advisor(uuid,text)',
    'public.claim_pending_advisor_projects()',
    'public.switch_active_role(text,bigint,uuid)',
    'public.is_bug_report_admin()',
    'private.current_active_role()',
    'private.project_owned_in_active_mode(uuid,uuid)',
    'private.project_reviewable_by_active_advisor(uuid,uuid)'
  ] loop
    if has_function_privilege('anon', function_signature, 'EXECUTE')
      or not has_function_privilege('authenticated', function_signature, 'EXECUTE')
    then
      raise exception 'api_function_privilege_mismatch:%', function_signature;
    end if;
  end loop;

  foreach function_signature in array array[
    'public.enforce_user_profile_role_version()',
    'public.audit_user_profile_role_change()',
    'public.enforce_project_authoring_role()',
    'public.restrict_advisor_workflow_update()',
    'public.enforce_student_advisor_workflow_progress()'
  ] loop
    if has_function_privilege('anon', function_signature, 'EXECUTE')
      or has_function_privilege('authenticated', function_signature, 'EXECUTE')
    then
      raise exception 'trigger_function_exposed:%', function_signature;
    end if;
  end loop;

  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private')
      and p.proname in (
        'audit_user_profile_role_change', 'switch_active_role',
        'set_project_advisor', 'claim_pending_advisor_projects',
        'restrict_advisor_workflow_update',
        'enforce_student_advisor_workflow_progress',
        'current_active_role', 'project_owned_in_active_mode',
        'project_reviewable_by_active_advisor'
      )
      and p.prosecdef
      and not exists (
        select 1
        from unnest(coalesce(p.proconfig, array[]::text[])) setting
        where setting like 'search_path=%'
      )
  ) then
    raise exception 'security_definer_without_fixed_search_path';
  end if;

  if (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'projects', 'generation_jobs', 'research_structures',
        'research_workflows', 'user_profiles', 'legal_consents',
        'bug_reports', 'user_profile_role_events'
      )
  ) <> 28 then
    raise exception 'public_policy_inventory_mismatch';
  end if;

  if not exists (
    select 1 from storage.buckets
    where id = 'bug-report-attachments' and public = false
  ) then
    raise exception 'private_bug_report_bucket_missing';
  end if;
end
$$;

select 'explicit_grants_ok';
