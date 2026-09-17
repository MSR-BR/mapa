\set ON_ERROR_STOP on

-- Structural security checks run as the database owner.
do $$
declare
  unsafe_function_count integer;
begin
  if (select count(*) from pg_policies where schemaname = 'public' and tablename = 'user_profiles') <> 2
    or (select count(*) from pg_policies where schemaname = 'public' and tablename = 'projects') <> 5
    or (select count(*) from pg_policies where schemaname = 'public' and tablename = 'research_workflows') <> 6
    or (select count(*) from pg_policies where schemaname = 'public' and tablename = 'generation_jobs') <> 4
    or (select count(*) from pg_policies where schemaname = 'public' and tablename = 'research_structures') <> 4
    or (select count(*) from pg_policies where schemaname = 'public' and tablename = 'legal_consents') <> 3
  then
    raise exception 'verification_policy_count_mismatch';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'projects',
        'research_workflows',
        'generation_jobs',
        'research_structures',
        'legal_consents'
      )
      and cmd in ('INSERT', 'UPDATE')
      and with_check is null
  ) then
    raise exception 'verification_missing_with_check';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'projects'
      and policyname = 'projects_select_own'
      and qual like '%owner_id = ( SELECT auth.uid()%'
      and qual like '%authoring_role = ( SELECT private.current_active_role()%'
  ) or not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'projects'
      and policyname = 'projects_select_advised'
      and qual like '%project_reviewable_by_active_advisor%'
  ) or not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'legal_consents'
      and policyname = 'legal_consents_select_own'
      and qual like '%current_active_role%'
  ) then
    raise exception 'verification_mode_aware_policy_missing';
  end if;

  if has_table_privilege('authenticated', 'public.user_profiles', 'UPDATE')
    or has_table_privilege('authenticated', 'public.user_profile_role_events', 'SELECT')
    or has_table_privilege('authenticated', 'public.projects', 'UPDATE')
    or not has_column_privilege('authenticated', 'public.projects', 'title', 'UPDATE')
    or has_column_privilege('authenticated', 'public.projects', 'advisor_id', 'UPDATE')
    or has_column_privilege('authenticated', 'public.projects', 'advisor_email', 'UPDATE')
    or has_column_privilege('authenticated', 'public.projects', 'owner_id', 'UPDATE')
  then
    raise exception 'verification_table_or_column_grants_invalid';
  end if;

  if not has_function_privilege(
    'authenticated',
    'public.switch_active_role(text,bigint,uuid)',
    'EXECUTE'
  ) or not has_function_privilege(
    'authenticated',
    'public.set_project_advisor(uuid,text)',
    'EXECUTE'
  ) or not has_function_privilege(
    'authenticated',
    'public.claim_pending_advisor_projects()',
    'EXECUTE'
  ) or not has_function_privilege(
    'authenticated',
    'private.current_active_role()',
    'EXECUTE'
  ) or has_function_privilege(
    'anon',
    'public.switch_active_role(text,bigint,uuid)',
    'EXECUTE'
  ) or has_function_privilege(
    'anon',
    'public.set_project_advisor(uuid,text)',
    'EXECUTE'
  ) or has_function_privilege(
    'public',
    'public.switch_active_role(text,bigint,uuid)',
    'EXECUTE'
  ) or has_function_privilege(
    'authenticated',
    'public.restrict_advisor_workflow_update()',
    'EXECUTE'
  ) then
    raise exception 'verification_function_grants_invalid';
  end if;

  select count(*) into unsafe_function_count
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'private')
    and p.proname in (
      'switch_active_role',
      'current_active_role',
      'project_owned_in_active_mode',
      'project_reviewable_by_active_advisor',
      'set_project_advisor',
      'claim_pending_advisor_projects',
      'restrict_advisor_workflow_update'
    )
    and (
      not p.prosecdef
      or p.proconfig is null
      or array_to_string(p.proconfig, ',') not like '%search_path=%'
      or array_to_string(p.proconfig, ',') like '%public%'
      or array_to_string(p.proconfig, ',') like '%auth%'
    );

  if unsafe_function_count <> 0 then
    raise exception 'verification_unsafe_security_definer:%', unsafe_function_count;
  end if;

  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'projects_owner_authoring_updated_idx'
  ) or not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'projects_advisor_authoring_idx'
  ) or not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'projects_pending_advisor_email_idx'
  ) then
    raise exception 'verification_rls_indexes_missing';
  end if;

  if not exists (
    select 1 from public.projects
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and authoring_role = 'student'
  ) or not exists (
    select 1 from public.projects
    where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
      and authoring_role = 'advisor'
      and advisor_id is null
      and advisor_email is null
  ) or not exists (
    select 1 from public.projects
    where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
      and authoring_role = 'student'
  ) then
    raise exception 'verification_authorship_backfill_changed';
  end if;

  if (
    select count(*) from public.legal_consents
    where user_id in (
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222'
    )
  ) <> 4 then
    raise exception 'verification_consent_rows_not_preserved';
  end if;
end
$$;

-- Anonymous access is denied at both table and RPC boundaries.
set role anon;
do $$
begin
  begin
    perform 1 from public.projects limit 1;
    raise exception 'verification_expected_anon_table_denial';
  exception
    when insufficient_privilege then null;
  end;

  begin
    perform public.switch_active_role(
      'student',
      1,
      '90000000-0000-4000-8000-000000000001'
    );
    raise exception 'verification_expected_anon_rpc_denial';
  exception
    when insufficient_privilege then null;
  end;
end
$$;
reset role;

-- Student matrix, including direct grants, mode switches and advisor binding.
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
set request.jwt.claim.email = 'student@example.invalid';

do $$
declare
  affected integer;
  linked boolean;
  returned_id uuid;
  switched record;
begin
  if private.current_active_role() <> 'student' then
    raise exception 'verification_student_mode_missing';
  end if;

  if (select count(*) from public.projects) <> 2
    or exists (
      select 1 from public.projects
      where id in (
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
      )
    )
  then
    raise exception 'verification_student_project_visibility';
  end if;

  if (select count(*) from public.legal_consents) <> 1
    or not exists (
      select 1 from public.legal_consents where profile_role = 'student'
    )
  then
    raise exception 'verification_student_consent_scope';
  end if;

  begin
    update public.user_profiles
    set active_role = 'advisor'
    where user_id = auth.uid();
    raise exception 'verification_expected_direct_profile_denial';
  exception
    when insufficient_privilege then null;
  end;

  begin
    update public.projects
    set advisor_email = 'other-advisor@example.invalid'
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'verification_expected_direct_advisor_column_denial';
  exception
    when insufficient_privilege then null;
  end;

  begin
    perform public.set_project_advisor(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'student@example.invalid'
    );
    raise exception 'verification_expected_self_advising_denial';
  exception
    when others then
      if sqlerrm <> 'self_advising_not_allowed' then raise; end if;
  end;

  begin
    perform public.set_project_advisor(
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'other-advisor@example.invalid'
    );
    raise exception 'verification_expected_non_owner_advisor_denial';
  exception
    when others then
      if sqlerrm <> 'project_not_found_or_not_owned' then raise; end if;
  end;

  select public.set_project_advisor(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'other-advisor@example.invalid'
  ) into linked;
  if not linked then
    raise exception 'verification_registered_advisor_not_linked';
  end if;

  select public.set_project_advisor(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'advisor@example.invalid'
  ) into linked;
  if not linked then
    raise exception 'verification_original_advisor_not_restored';
  end if;

  update public.projects
  set title = 'Projeto estudantil atualizado',
      updated_at = statement_timestamp()
  where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'verification_student_update_failed';
  end if;

  insert into public.projects (
    id, owner_id, title, authoring_role, workflow_version
  ) values (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    auth.uid(),
    'Projeto estudantil temporário',
    'advisor',
    2
  ) returning id into returned_id;

  if returned_id <> 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' then
    raise exception 'verification_student_insert_returning_failed';
  end if;

  if not exists (
    select 1 from public.projects
    where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
      and authoring_role = 'student'
  ) then
    raise exception 'verification_student_insert_authorship';
  end if;

  delete from public.projects
  where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'verification_student_delete_failed';
  end if;

  insert into public.generation_jobs (
    id, project_id, owner_id, idempotency_key
  ) values (
    '10000000-0000-4000-8000-000000000021',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    auth.uid(),
    '10000000-0000-4000-8000-000000000031'
  );
  update public.generation_jobs
  set status = 'researching', updated_at = statement_timestamp()
  where id = '10000000-0000-4000-8000-000000000021';
  delete from public.generation_jobs
  where id = '10000000-0000-4000-8000-000000000021';

  select * into switched
  from public.switch_active_role(
    'advisor',
    1,
    '90000000-0000-4000-8000-000000000011'
  );
  if switched.active_role <> 'advisor' or switched.role_version <> 2 then
    raise exception 'verification_student_to_advisor_switch';
  end if;

  if exists (
    select 1 from public.projects
    where id in (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
    )
  ) then
    raise exception 'verification_student_projects_visible_in_advisor_mode';
  end if;

  if (select count(*) from public.legal_consents) <> 1
    or not exists (
      select 1 from public.legal_consents where profile_role = 'advisor'
    )
  then
    raise exception 'verification_advisor_consent_scope_after_switch';
  end if;

  insert into public.projects (
    id, owner_id, title, workflow_version
  ) values (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
    auth.uid(),
    'Projeto autônomo criado após troca',
    2
  ) returning id into returned_id;

  if returned_id <> 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1' then
    raise exception 'verification_advisor_insert_returning_failed';
  end if;

  update public.projects
  set title = 'Projeto autônomo atualizado',
      updated_at = statement_timestamp()
  where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1';
  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'verification_advisor_owned_update_failed';
  end if;

  insert into public.projects (
    id, owner_id, title, workflow_version
  ) values (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
    auth.uid(),
    'Projeto autônomo descartável',
    2
  );
  delete from public.projects
  where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2';
  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'verification_advisor_owned_delete_failed';
  end if;

  begin
    insert into public.projects (
      id, owner_id, title, advisor_email, workflow_version
    ) values (
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3',
      auth.uid(),
      'Projeto autônomo inválido',
      'advisor@example.invalid',
      2
    );
    raise exception 'verification_expected_advisor_supervision_denial';
  exception
    when others then
      if sqlerrm <> 'advisor_authored_project_cannot_have_supervisor' then raise; end if;
  end;

  begin
    insert into public.generation_jobs (
      id, project_id, owner_id, idempotency_key
    ) values (
      '10000000-0000-4000-8000-000000000022',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      auth.uid(),
      '10000000-0000-4000-8000-000000000032'
    );
    raise exception 'verification_expected_cross_mode_child_denial';
  exception
    when insufficient_privilege then null;
  end;

  begin
    perform public.set_project_advisor(
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
      'advisor@example.invalid'
    );
    raise exception 'verification_expected_wrong_mode_advisor_denial';
  exception
    when others then
      if sqlerrm <> 'student_mode_required' then raise; end if;
  end;

  select * into switched
  from public.switch_active_role(
    'student',
    2,
    '90000000-0000-4000-8000-000000000012'
  );
  if switched.active_role <> 'student' or switched.role_version <> 3 then
    raise exception 'verification_advisor_to_student_switch';
  end if;

  if exists (
    select 1 from public.projects
    where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1'
  ) or not exists (
    select 1 from public.projects
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ) then
    raise exception 'verification_reverse_mode_visibility';
  end if;

  begin
    perform public.switch_active_role(
      'advisor',
      2,
      '90000000-0000-4000-8000-000000000013'
    );
    raise exception 'verification_expected_stale_version_denial';
  exception
    when others then
      if sqlerrm <> 'role_version_conflict' then raise; end if;
  end;

  begin
    perform public.switch_active_role(
      'invalid',
      3,
      '90000000-0000-4000-8000-000000000014'
    );
    raise exception 'verification_expected_invalid_role_denial';
  exception
    when others then
      if sqlerrm <> 'invalid_active_role' then raise; end if;
  end;
end
$$;

-- Advisor matrix: autonomous ownership, linked review and pending invitation.
set request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
set request.jwt.claim.email = 'advisor@example.invalid';

do $$
declare
  affected integer;
  claimed integer;
  linked boolean;
  switched record;
begin
  if private.current_active_role() <> 'advisor' then
    raise exception 'verification_advisor_mode_missing';
  end if;

  if (select count(*) from public.projects) <> 2
    or not exists (
      select 1 from public.projects
      where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    )
    or not exists (
      select 1 from public.projects
      where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    )
    or exists (
      select 1 from public.projects
      where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
    )
    or exists (
      select 1 from public.projects
      where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
    )
  then
    raise exception 'verification_advisor_initial_visibility';
  end if;

  select public.claim_pending_advisor_projects() into claimed;
  if claimed <> 1 or not exists (
    select 1 from public.projects
    where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
      and advisor_id = auth.uid()
  ) then
    raise exception 'verification_pending_claim_failed';
  end if;

  select public.claim_pending_advisor_projects() into claimed;
  if claimed <> 0 then
    raise exception 'verification_pending_claim_not_idempotent';
  end if;

  if (select count(*) from public.projects) <> 3
    or (select count(*) from public.generation_jobs) <> 1
    or (select count(*) from public.research_structures) <> 1
    or (select count(*) from public.research_workflows) <> 2
  then
    raise exception 'verification_advisor_resource_matrix';
  end if;

  update public.projects
  set title = 'Projeto autônomo do orientador atualizado',
      updated_at = statement_timestamp()
  where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'verification_advisor_owned_project_update';
  end if;

  update public.projects
  set title = 'Tentativa de alterar projeto vinculado',
      updated_at = statement_timestamp()
  where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'verification_linked_project_was_mutated';
  end if;

  update public.generation_jobs
  set status = 'researching', updated_at = statement_timestamp()
  where project_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'verification_advisor_owned_job_update';
  end if;

  update public.research_structures
  set warnings = array['verified'], updated_at = statement_timestamp()
  where project_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'verification_advisor_owned_structure_update';
  end if;

  update public.research_workflows
  set content = '{
      "activeStep": 1,
      "academic": "preserved",
      "advisorReviews": [{
        "id": "review-1",
        "status": "pending",
        "advisorComments": "Parecer registrado",
        "advisorId": "22222222-2222-4222-8222-222222222222",
        "reviewedAt": null,
        "targetState": "validating_general_objective",
        "targetStableState": "validating_general_objective",
        "targetActiveStep": 2
      }]
    }'::jsonb,
      revision = revision + 1,
      updated_at = statement_timestamp()
  where project_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'verification_linked_review_comment_failed';
  end if;

  begin
    update public.research_workflows
    set content = '{
        "activeStep": 1,
        "academic": "tampered",
        "advisorReviews": [{
          "id": "review-1",
          "status": "pending",
          "advisorComments": "Parecer registrado",
          "advisorId": "22222222-2222-4222-8222-222222222222",
          "reviewedAt": null,
          "targetState": "validating_general_objective",
          "targetStableState": "validating_general_objective",
          "targetActiveStep": 2
        }]
      }'::jsonb,
        revision = revision + 1,
        updated_at = statement_timestamp()
    where project_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'verification_expected_academic_tamper_denial';
  exception
    when others then
      if sqlerrm <> 'advisor_workflow_content_not_allowed' then raise; end if;
  end;

  begin
    perform public.set_project_advisor(
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'other-advisor@example.invalid'
    );
    raise exception 'verification_expected_advisor_mode_set_denial';
  exception
    when others then
      if sqlerrm <> 'student_mode_required' then raise; end if;
  end;

  select * into switched
  from public.switch_active_role(
    'student',
    1,
    '90000000-0000-4000-8000-000000000021'
  );
  if switched.active_role <> 'student' or switched.role_version <> 2 then
    raise exception 'verification_advisor_to_student_mode_switch';
  end if;

  if (select count(*) from public.projects) <> 1
    or not exists (
      select 1 from public.projects
      where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
    )
    or (select count(*) from public.generation_jobs) <> 1
    or (select count(*) from public.research_workflows) <> 1
  then
    raise exception 'verification_advisor_owner_cross_mode_matrix';
  end if;

  begin
    perform public.claim_pending_advisor_projects();
    raise exception 'verification_expected_claim_wrong_mode_denial';
  exception
    when others then
      if sqlerrm <> 'advisor_mode_required' then raise; end if;
  end;

  begin
    perform public.set_project_advisor(
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'other-advisor@example.invalid'
    );
    raise exception 'verification_expected_advisor_authorship_denial';
  exception
    when others then
      if sqlerrm <> 'student_authored_project_required' then raise; end if;
  end;

  select public.set_project_advisor(
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'other-advisor@example.invalid'
  ) into linked;
  if not linked then
    raise exception 'verification_historical_student_project_link_failed';
  end if;

  select * into switched
  from public.switch_active_role(
    'advisor',
    2,
    '90000000-0000-4000-8000-000000000022'
  );
  if switched.active_role <> 'advisor' or switched.role_version <> 3 then
    raise exception 'verification_advisor_mode_restore';
  end if;
end
$$;

-- Authenticated user without a profile receives no project context.
set request.jwt.claim.sub = '44444444-4444-4444-8444-444444444444';
set request.jwt.claim.email = 'no-profile@example.invalid';

do $$
begin
  if private.current_active_role() is not null
    or (select count(*) from public.projects) <> 0
  then
    raise exception 'verification_missing_profile_visibility';
  end if;

  begin
    insert into public.projects (owner_id, title)
    values (auth.uid(), 'Projeto sem perfil');
    raise exception 'verification_expected_missing_profile_insert_denial';
  exception
    when others then
      if sqlerrm <> 'project_owner_profile_required' then raise; end if;
  end;

  begin
    perform public.switch_active_role(
      'student',
      1,
      '90000000-0000-4000-8000-000000000031'
    );
    raise exception 'verification_expected_missing_profile_rpc_denial';
  exception
    when others then
      if sqlerrm <> 'user_profile_not_found' then raise; end if;
  end;
end
$$;

reset role;
set request.jwt.claim.sub = '';
set request.jwt.claim.email = '';

-- Final preservation checks as owner.
do $$
begin
  if not exists (
    select 1 from public.projects
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and authoring_role = 'student'
      and advisor_id = '22222222-2222-4222-8222-222222222222'
  ) or not exists (
    select 1 from public.projects
    where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1'
      and authoring_role = 'advisor'
      and advisor_id is null
      and advisor_email is null
  ) then
    raise exception 'verification_final_project_preservation';
  end if;

  if (
    select content ->> 'academic'
    from public.research_workflows
    where project_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ) <> 'preserved' then
    raise exception 'verification_academic_content_changed';
  end if;

  if (select count(*) from public.legal_consents) <> 4 then
    raise exception 'verification_consent_rows_changed';
  end if;

  if not exists (
    select 1 from public.user_profiles
    where user_id = '11111111-1111-4111-8111-111111111111'
      and active_role = 'student'
      and role_version = 3
  ) or not exists (
    select 1 from public.user_profiles
    where user_id = '22222222-2222-4222-8222-222222222222'
      and active_role = 'advisor'
      and role_version = 3
  ) then
    raise exception 'verification_final_mode_versions';
  end if;
end
$$;

select 'mode_aware_rls_ok' as result;
