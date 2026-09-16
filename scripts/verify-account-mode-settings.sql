\set ON_ERROR_STOP on

do $$
declare
  switched record;
  replayed record;
begin
  perform set_config(
    'request.jwt.claim.sub',
    '11111111-1111-4111-8111-111111111111',
    true
  );

  select *
  into switched
  from public.switch_active_role(
    'student',
    2,
    '77777777-7777-4777-8777-777777777777'
  );

  if switched.active_role <> 'student' or switched.role_version <> 3 then
    raise exception 'verification_reverse_switch_failed';
  end if;

  select *
  into replayed
  from public.switch_active_role(
    'student',
    2,
    '77777777-7777-4777-8777-777777777777'
  );

  if replayed.active_role <> 'student' or replayed.role_version <> 3 then
    raise exception 'verification_reverse_idempotent_replay_failed';
  end if;

  begin
    perform public.switch_active_role(
      'advisor',
      2,
      '88888888-8888-4888-8888-888888888888'
    );
    raise exception 'verification_expected_reverse_version_conflict';
  exception
    when others then
      if sqlerrm <> 'role_version_conflict' then
        raise;
      end if;
  end;

  if not exists (
    select 1
    from public.user_profiles
    where user_id = '11111111-1111-4111-8111-111111111111'
      and active_role = 'student'
      and role_version = 3
  ) then
    raise exception 'verification_reverse_profile_state_failed';
  end if;

  if (
    select count(*)
    from public.user_profile_role_events
    where user_id = '11111111-1111-4111-8111-111111111111'
      and idempotency_key = '77777777-7777-4777-8777-777777777777'
      and event_type = 'role_switched'
      and active_role = 'student'
      and role_version = 3
  ) <> 1 then
    raise exception 'verification_reverse_audit_or_idempotency_failed';
  end if;

  if not exists (
    select 1
    from public.projects
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and authoring_role = 'student'
  ) or not exists (
    select 1
    from public.projects
    where owner_id = '11111111-1111-4111-8111-111111111111'
      and title = 'Projeto autônomo após troca'
      and authoring_role = 'advisor'
  ) then
    raise exception 'verification_authorship_changed_after_reverse_switch';
  end if;
end
$$;

select 'account_mode_settings_ok' as result;
