\set ON_ERROR_STOP on

do $$
declare
  forged_project_role text;
  switched record;
  replayed record;
  noop_result record;
begin
  if (select count(*) from public.user_profiles) <> 2 then
    raise exception 'verification_profile_count_changed';
  end if;

  if exists (
    select 1
    from public.user_profiles
    where role_version <> 1
      or role_changed_at is null
  ) then
    raise exception 'verification_profile_backfill_failed';
  end if;

  if (select count(*) from public.user_profile_role_events where event_type = 'baseline') <> 2 then
    raise exception 'verification_baseline_events_failed';
  end if;

  if exists (
    select 1
    from public.projects
    where authoring_role not in ('student', 'advisor')
  ) then
    raise exception 'verification_project_backfill_failed';
  end if;

  if not exists (
    select 1
    from public.projects
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and authoring_role = 'student'
  ) or not exists (
    select 1
    from public.projects
    where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
      and authoring_role = 'advisor'
      and advisor_id is null
      and advisor_email is null
  ) or not exists (
    select 1
    from public.projects
    where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
      and authoring_role = 'advisor'
      and advisor_id is null
      and advisor_email is null
  ) or not exists (
    select 1
    from public.projects
    where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
      and authoring_role = 'student'
      and advisor_id = '44444444-4444-4444-8444-444444444444'
      and advisor_email = 'historical-advisor@example.invalid'
  ) then
    raise exception 'verification_historical_authoring_failed';
  end if;

  if has_table_privilege('authenticated', 'public.user_profiles', 'UPDATE') then
    raise exception 'verification_profile_update_grant_reopened';
  end if;

  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'user_profile_role_events'
      and indexname = 'user_profile_role_events_actor_idx'
  ) then
    raise exception 'verification_actor_fk_index_missing';
  end if;

  if has_table_privilege('authenticated', 'public.user_profile_role_events', 'SELECT')
    or has_table_privilege('authenticated', 'public.user_profile_role_events', 'INSERT')
    or has_table_privilege('authenticated', 'public.user_profile_role_events', 'UPDATE')
    or has_table_privilege('authenticated', 'public.user_profile_role_events', 'DELETE')
  then
    raise exception 'verification_event_table_exposed';
  end if;

  if not has_table_privilege('service_role', 'public.user_profile_role_events', 'SELECT')
    or has_table_privilege('service_role', 'public.user_profile_role_events', 'INSERT')
    or has_table_privilege('service_role', 'public.user_profile_role_events', 'UPDATE')
    or has_table_privilege('service_role', 'public.user_profile_role_events', 'DELETE')
  then
    raise exception 'verification_event_service_privileges_invalid';
  end if;

  if has_function_privilege(
    'authenticated',
    'public.switch_active_role(text,bigint,uuid)',
    'EXECUTE'
  ) or has_function_privilege(
    'anon',
    'public.switch_active_role(text,bigint,uuid)',
    'EXECUTE'
  ) then
    raise exception 'verification_switch_rpc_exposed';
  end if;

  if not (
    select relrowsecurity
    from pg_class
    where oid = 'public.user_profile_role_events'::regclass
  ) then
    raise exception 'verification_event_rls_disabled';
  end if;

  insert into public.projects (owner_id, title, authoring_role)
  values (
    '11111111-1111-4111-8111-111111111111',
    'Payload de autoria adulterado',
    'advisor'
  )
  returning authoring_role into forged_project_role;

  if forged_project_role <> 'student' then
    raise exception 'verification_forged_authoring_was_trusted';
  end if;

  begin
    update public.projects
    set authoring_role = 'advisor'
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'verification_expected_immutable_authoring_failure';
  exception
    when others then
      if sqlerrm <> 'project_authoring_role_is_immutable' then
        raise;
      end if;
  end;

  perform set_config(
    'request.jwt.claim.sub',
    '11111111-1111-4111-8111-111111111111',
    true
  );

  select *
  into switched
  from public.switch_active_role(
    'advisor',
    1,
    '44444444-4444-4444-8444-444444444444'
  );

  if switched.active_role <> 'advisor' or switched.role_version <> 2 then
    raise exception 'verification_atomic_switch_failed';
  end if;

  select *
  into replayed
  from public.switch_active_role(
    'advisor',
    1,
    '44444444-4444-4444-8444-444444444444'
  );

  if replayed.active_role <> 'advisor' or replayed.role_version <> 2 then
    raise exception 'verification_idempotent_replay_failed';
  end if;

  begin
    perform public.switch_active_role(
      'student',
      1,
      '55555555-5555-4555-8555-555555555555'
    );
    raise exception 'verification_expected_version_conflict';
  exception
    when others then
      if sqlerrm <> 'role_version_conflict' then
        raise;
      end if;
  end;

  select *
  into noop_result
  from public.switch_active_role(
    'advisor',
    2,
    '66666666-6666-4666-8666-666666666666'
  );

  if noop_result.active_role <> 'advisor' or noop_result.role_version <> 2 then
    raise exception 'verification_idempotent_noop_failed';
  end if;

  if not exists (
    select 1
    from public.projects
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and authoring_role = 'student'
  ) then
    raise exception 'verification_existing_authorship_changed_with_mode';
  end if;

  begin
    insert into public.projects (
      owner_id,
      title,
      advisor_email
    ) values (
      '11111111-1111-4111-8111-111111111111',
      'Projeto autônomo inválido',
      'supervisor@example.invalid'
    );
    raise exception 'verification_expected_advisor_supervision_failure';
  exception
    when others then
      if sqlerrm <> 'advisor_authored_project_cannot_have_supervisor' then
        raise;
      end if;
  end;

  insert into public.projects (owner_id, title)
  values (
    '11111111-1111-4111-8111-111111111111',
    'Projeto autônomo após troca'
  );

  if not exists (
    select 1
    from public.projects
    where owner_id = '11111111-1111-4111-8111-111111111111'
      and title = 'Projeto autônomo após troca'
      and authoring_role = 'advisor'
      and advisor_id is null
      and advisor_email is null
  ) then
    raise exception 'verification_advisor_project_not_autonomous';
  end if;

  insert into public.user_profiles (
    user_id,
    active_role,
    role_version,
    role_changed_at
  ) values (
    '33333333-3333-4333-8333-333333333333',
    'student',
    99,
    '2000-01-01 00:00:00+00'
  );

  if not exists (
    select 1
    from public.user_profiles
    where user_id = '33333333-3333-4333-8333-333333333333'
      and role_version = 1
      and role_changed_at = created_at
  ) then
    raise exception 'verification_new_profile_versioning_failed';
  end if;

  if not exists (
    select 1
    from public.user_profile_role_events
    where user_id = '33333333-3333-4333-8333-333333333333'
      and event_type = 'profile_created'
      and role_version = 1
  ) then
    raise exception 'verification_new_profile_audit_failed';
  end if;

  if (select count(*) from public.user_profile_role_events) <> 5 then
    raise exception 'verification_unexpected_event_count';
  end if;

  if exists (
    select 1
    from public.projects
    where authoring_role = 'advisor'
      and (advisor_id is not null or advisor_email is not null)
  ) then
    raise exception 'verification_advisor_autonomy_constraint_failed';
  end if;
end
$$;

select 'account_mode_foundation_ok' as result;
