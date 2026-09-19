\set ON_ERROR_STOP on

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'enforce_student_advisor_workflow_progress_trigger'
      and not tgisinternal
  ) then
    raise exception 'verification_c89_trigger_missing';
  end if;
  if has_function_privilege(
    'authenticated',
    'public.enforce_student_advisor_workflow_progress()',
    'EXECUTE'
  ) then
    raise exception 'verification_c89_function_exposed';
  end if;
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'enforce_student_advisor_workflow_progress'
      and (
        not p.prosecdef
        or p.proconfig is null
        or array_to_string(p.proconfig, ',') not like '%search_path=%'
        or array_to_string(p.proconfig, ',') like '%public%'
      )
  ) then
    raise exception 'verification_c89_function_unsafe';
  end if;
end
$$;

set role authenticated;
set request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
set request.jwt.claim.email = 'student@example.invalid';

insert into public.projects (
  id, owner_id, title, workflow_version
) values (
  '89898989-8989-4989-8989-898989898989',
  auth.uid(),
  'Projeto C89 sem orientador',
  2
);

insert into public.research_workflows (
  project_id,
  owner_id,
  state,
  stable_state,
  content,
  validation_state
) values (
  '89898989-8989-4989-8989-898989898989',
  auth.uid(),
  'choosing_problem',
  'choosing_problem',
  '{"activeStep":"problem_statement","advisorReviews":[],"draft":"initial"}'::jsonb,
  '{}'::jsonb
);

-- Salvar rascunho não é avanço e continua permitido.
update public.research_workflows
set content = jsonb_set(content, '{draft}', '"saved"'::jsonb),
    revision = revision + 1,
    updated_at = statement_timestamp()
where project_id = '89898989-8989-4989-8989-898989898989';

do $$
begin
  if not exists (
    select 1
    from public.research_workflows
    where project_id = '89898989-8989-4989-8989-898989898989'
      and content ->> 'draft' = 'saved'
  ) then
    raise exception 'verification_c89_draft_not_saved';
  end if;

  begin
    update public.research_workflows
    set state = 'validating_general_objective',
        stable_state = 'validating_general_objective',
        content = jsonb_set(content, '{activeStep}', '"general_objective"'::jsonb),
        revision = revision + 1,
        updated_at = statement_timestamp()
    where project_id = '89898989-8989-4989-8989-898989898989';
    raise exception 'verification_c89_expected_direct_progress_denial';
  exception
    when others then
      if sqlerrm <> 'student_advisor_approval_required' then raise; end if;
  end;

  begin
    update public.research_workflows
    set content = jsonb_set(
          content,
          '{advisorReviews}',
          (content -> 'advisorReviews') || jsonb_build_array(jsonb_build_object(
            'id', '89898989-0000-4000-8000-000000000001',
            'status', 'pending',
            'advisorEmail', null,
            'advisorComments', null,
            'advisorId', null,
            'requestedAt', statement_timestamp(),
            'reviewedAt', null,
            'sourceRevision', 2,
            'step', 'problem_statement',
            'studentEmail', 'student@example.invalid',
            'targetState', 'validating_general_objective',
            'targetStableState', 'validating_general_objective',
            'targetActiveStep', 'general_objective'
          ))
        ),
        revision = revision + 1,
        updated_at = statement_timestamp()
    where project_id = '89898989-8989-4989-8989-898989898989';
    raise exception 'verification_c89_expected_missing_email_denial';
  exception
    when others then
      if sqlerrm <> 'student_advisor_email_required' then raise; end if;
  end;
end
$$;

select public.set_project_advisor(
  '89898989-8989-4989-8989-898989898989',
  'advisor@example.invalid'
) as advisor_linked \gset

-- A submissão correta mantém a etapa e cria a revisão pendente.
update public.research_workflows
set content = jsonb_set(
      content,
      '{advisorReviews}',
      (content -> 'advisorReviews') || jsonb_build_array(jsonb_build_object(
        'id', '89898989-0000-4000-8000-000000000001',
        'status', 'pending',
        'advisorEmail', 'advisor@example.invalid',
        'advisorComments', null,
        'advisorId', null,
        'requestedAt', statement_timestamp(),
        'reviewedAt', null,
        'sourceRevision', 2,
        'step', 'problem_statement',
        'studentEmail', 'student@example.invalid',
        'targetState', 'validating_general_objective',
        'targetStableState', 'validating_general_objective',
        'targetActiveStep', 'general_objective'
      ))
    ),
    revision = revision + 1,
    updated_at = statement_timestamp()
where project_id = '89898989-8989-4989-8989-898989898989';

do $$
begin
  if not exists (
    select 1
    from public.research_workflows
    where project_id = '89898989-8989-4989-8989-898989898989'
      and state = 'choosing_problem'
      and content #>> '{advisorReviews,0,status}' = 'pending'
  ) then
    raise exception 'verification_c89_pending_review_not_saved';
  end if;

  begin
    update public.research_workflows
    set state = 'validating_general_objective',
        stable_state = 'validating_general_objective',
        content = jsonb_set(content, '{activeStep}', '"general_objective"'::jsonb),
        revision = revision + 1,
        updated_at = statement_timestamp()
    where project_id = '89898989-8989-4989-8989-898989898989';
    raise exception 'verification_c89_expected_owner_bypass_denial';
  exception
    when others then
      if sqlerrm <> 'student_advisor_approval_required' then raise; end if;
  end;
end
$$;

-- Somente a conta vinculada, no modo Orientador, efetiva o avanço.
set request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
set request.jwt.claim.email = 'advisor@example.invalid';

update public.research_workflows
set state = 'validating_general_objective',
    stable_state = 'validating_general_objective',
    content = jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            content,
            '{advisorReviews,0,status}',
            '"approved"'::jsonb
          ),
          '{advisorReviews,0,advisorId}',
          to_jsonb(auth.uid()::text)
        ),
        '{advisorReviews,0,reviewedAt}',
        to_jsonb(statement_timestamp()::text)
      ),
      '{activeStep}',
      '"general_objective"'::jsonb
    ),
    revision = revision + 1,
    updated_at = statement_timestamp()
where project_id = '89898989-8989-4989-8989-898989898989';

-- Projeto próprio do Orientador permanece autônomo.
update public.research_workflows
set state = 'completed',
    stable_state = 'completed',
    content = jsonb_set(content, '{activeStep}', 'null'::jsonb),
    revision = revision + 1,
    updated_at = statement_timestamp()
where project_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

reset role;

do $$
begin
  if not exists (
    select 1
    from public.research_workflows
    where project_id = '89898989-8989-4989-8989-898989898989'
      and state = 'validating_general_objective'
      and stable_state = 'validating_general_objective'
      and content #>> '{advisorReviews,0,status}' = 'approved'
  ) then
    raise exception 'verification_c89_advisor_approval_failed';
  end if;
  if not exists (
    select 1
    from public.research_workflows
    where project_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
      and state = 'completed'
      and stable_state = 'completed'
  ) then
    raise exception 'verification_c89_advisor_autonomy_failed';
  end if;
end
$$;

select 'student_advisor_gate_ok';
