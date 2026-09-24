-- C104: metadados de segurança do Supabase remoto.
-- Esta consulta é somente leitura e não acessa linhas de usuários ou projetos.

with owned_tables as (
  select
    n.nspname as schema_name,
    c.relname as object_name,
    c.relkind,
    c.relrowsecurity,
    c.relforcerowsecurity
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'p')
),
owned_other_relations as (
  select n.nspname as schema_name, c.relname as object_name, c.relkind
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('S', 'v', 'm')
),
owned_functions as (
  select
    n.nspname as schema_name,
    p.proname as function_name,
    pg_catalog.pg_get_function_identity_arguments(p.oid) as identity_arguments,
    p.prosecdef as security_definer,
    p.proconfig,
    pg_catalog.has_function_privilege(
      'public', p.oid, 'EXECUTE'
    ) as public_execute,
    pg_catalog.has_function_privilege(
      'anon', p.oid, 'EXECUTE'
    ) as anon_execute,
    pg_catalog.has_function_privilege(
      'authenticated', p.oid, 'EXECUTE'
    ) as authenticated_execute,
    pg_catalog.has_function_privilege(
      'service_role', p.oid, 'EXECUTE'
    ) as service_role_execute
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'private')
    and p.proname in (
      'set_project_advisor',
      'claim_pending_advisor_projects',
      'switch_active_role',
      'is_bug_report_admin',
      'current_active_role',
      'project_owned_in_active_mode',
      'project_reviewable_by_active_advisor',
      'enforce_user_profile_role_version',
      'audit_user_profile_role_change',
      'enforce_project_authoring_role',
      'restrict_advisor_workflow_update',
      'enforce_student_advisor_workflow_progress'
    )
),
table_acl as (
  select
    table_schema,
    table_name,
    grantee,
    string_agg(privilege_type, ',' order by privilege_type) as privileges
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name in (select object_name from owned_tables)
    and grantee in ('PUBLIC', 'anon', 'authenticated', 'service_role')
  group by table_schema, table_name, grantee
),
project_update_columns as (
  select grantee, column_name
  from information_schema.role_column_grants
  where table_schema = 'public'
    and table_name = 'projects'
    and privilege_type = 'UPDATE'
    and grantee in ('PUBLIC', 'anon', 'authenticated', 'service_role')
),
data_api_settings as (
  select distinct setting
  from (
    select unnest(coalesce(r.rolconfig, array[]::text[])) as setting
    from pg_catalog.pg_roles r
    where r.rolname = 'authenticator'
    union all
    select unnest(coalesce(s.setconfig, array[]::text[])) as setting
    from pg_catalog.pg_db_role_setting s
    join pg_catalog.pg_roles r on r.oid = s.setrole
    where r.rolname = 'authenticator'
  ) settings
  where setting like 'pgrst.db_schemas=%'
),
default_acl as (
  select
    owner.rolname as owner_name,
    coalesce(n.nspname, '*') as schema_name,
    d.defaclobjtype,
    d.defaclacl::text as acl
  from pg_catalog.pg_default_acl d
  join pg_catalog.pg_roles owner on owner.oid = d.defaclrole
  left join pg_catalog.pg_namespace n on n.oid = d.defaclnamespace
  where coalesce(n.nspname, 'public') = 'public'
),
policy_inventory as (
  select schemaname, tablename, policyname, permissive, roles, cmd
  from pg_catalog.pg_policies
  where schemaname = 'public'
    and tablename in (select object_name from owned_tables)
),
trigger_inventory as (
  select
    event_object_schema,
    event_object_table,
    trigger_name,
    event_manipulation,
    action_timing
  from information_schema.triggers
  where event_object_schema = 'public'
    and trigger_name in (
      'enforce_user_profile_role_version_trigger',
      'audit_user_profile_role_change_trigger',
      'enforce_project_authoring_role_trigger',
      'restrict_advisor_workflow_update_trigger',
      'enforce_student_advisor_workflow_progress_trigger'
    )
)
select jsonb_build_object(
  'identity', jsonb_build_object(
    'database', current_database(),
    'server_version', current_setting('server_version')
  ),
  'data_api_schema_settings', coalesce((
    select jsonb_agg(setting order by setting) from data_api_settings
  ), '[]'::jsonb),
  'schema_privileges', jsonb_build_object(
    'public_on_private', pg_catalog.has_schema_privilege('public', 'private', 'USAGE'),
    'anon_on_private', pg_catalog.has_schema_privilege('anon', 'private', 'USAGE'),
    'authenticated_on_private', pg_catalog.has_schema_privilege('authenticated', 'private', 'USAGE')
  ),
  'tables', coalesce((
    select jsonb_agg(to_jsonb(t) order by object_name) from owned_tables t
  ), '[]'::jsonb),
  'views_and_sequences', coalesce((
    select jsonb_agg(to_jsonb(o) order by object_name) from owned_other_relations o
  ), '[]'::jsonb),
  'table_acl', coalesce((
    select jsonb_agg(to_jsonb(a) order by table_name, grantee) from table_acl a
  ), '[]'::jsonb),
  'project_update_columns', coalesce((
    select jsonb_agg(to_jsonb(c) order by grantee, column_name)
    from project_update_columns c
  ), '[]'::jsonb),
  'functions', coalesce((
    select jsonb_agg(to_jsonb(f) order by schema_name, function_name, identity_arguments)
    from owned_functions f
  ), '[]'::jsonb),
  'policies', coalesce((
    select jsonb_agg(to_jsonb(p) order by tablename, policyname) from policy_inventory p
  ), '[]'::jsonb),
  'policy_count', (select count(*) from policy_inventory),
  'triggers', coalesce((
    select jsonb_agg(to_jsonb(t) order by event_object_table, trigger_name, event_manipulation)
    from trigger_inventory t
  ), '[]'::jsonb),
  'default_acl', coalesce((
    select jsonb_agg(to_jsonb(a) order by owner_name, schema_name, defaclobjtype)
    from default_acl a
  ), '[]'::jsonb),
  'private_bug_report_bucket', exists (
    select 1 from storage.buckets
    where id = 'bug-report-attachments' and public = false
  ),
  'bug_report_storage_policy_count', (
    select count(*) from pg_catalog.pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname like 'bug_report_attachments_%'
  )
) as c104_remote_audit;
