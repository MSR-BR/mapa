begin;

-- C125 / SEC-03. API callers may create a student workflow only at its initial
-- state. Reject forged progress rather than silently accepting it.
create or replace function public.guard_workflow_owner_reviews()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  author_role text;
  previous_reviews jsonb;
  next_reviews jsonb := coalesce(new.content -> 'advisorReviews', '[]'::jsonb);
  old_item jsonb;
  new_item jsonb;
  submitted jsonb;
  appending boolean;
  item_index integer;
begin
  select p.authoring_role into author_role from public.projects p
  where p.id = new.project_id and p.owner_id = new.owner_id;

  if tg_op = 'INSERT' then
    if next_reviews is distinct from '[]'::jsonb then
      raise exception 'workflow_initial_reviews_must_be_empty' using errcode = '23514';
    end if;
    if author_role = 'student' and (
      new.state <> 'draft_prompt' or new.stable_state <> 'draft_prompt'
      or new.content ->> 'activeStep' is not null
    ) then
      raise exception 'student_workflow_initial_state_required' using errcode = '23514';
    end if;
    return new;
  end if;

  -- The existing advisor trigger controls non-owner decisions. No public RPC
  -- grants access to this trigger function.
  if auth.uid() is distinct from old.owner_id then return new; end if;
  previous_reviews := coalesce(old.content -> 'advisorReviews', '[]'::jsonb);
  if jsonb_typeof(previous_reviews) is distinct from 'array'
    or jsonb_typeof(next_reviews) is distinct from 'array'
  then
    raise exception 'workflow_review_array_required' using errcode = '23514';
  end if;
  if jsonb_array_length(next_reviews) < jsonb_array_length(previous_reviews)
    or jsonb_array_length(next_reviews) > jsonb_array_length(previous_reviews) + 1
  then
    raise exception 'workflow_review_history_immutable' using errcode = '23514';
  end if;
  appending := jsonb_array_length(next_reviews) = jsonb_array_length(previous_reviews) + 1;
  for item_index in 0 .. jsonb_array_length(previous_reviews) - 1 loop
    old_item := previous_reviews -> item_index;
    new_item := next_reviews -> item_index;
    if old_item is not distinct from new_item then continue; end if;
    -- withAdvisorReviewRequest supersedes a pending request when resubmitting.
    -- Only its status and previously-empty reviewedAt may change; the decision,
    -- identity, comments, targets and all approved history remain immutable.
    if (appending
      and old_item ->> 'status' in ('pending', 'changes_requested')
      and new_item ->> 'status' = 'changes_requested'
      and new_item ->> 'reviewedAt' is not null
      and (old_item ->> 'reviewedAt' is null
        or old_item -> 'reviewedAt' = new_item -> 'reviewedAt')
      and (old_item - array['status', 'reviewedAt']) = (new_item - array['status', 'reviewedAt'])
    ) is not true then
      raise exception 'workflow_review_history_immutable' using errcode = '23514';
    end if;
  end loop;
  if appending then
    submitted := next_reviews -> (jsonb_array_length(next_reviews) - 1);
    if jsonb_typeof(submitted) is distinct from 'object'
      or submitted ->> 'status' is distinct from 'pending'
      or nullif(btrim(submitted ->> 'id'), '') is null
      or submitted ->> 'advisorId' is not null
      or submitted ->> 'advisorComments' is not null
      or submitted ->> 'reviewedAt' is not null
      or exists (select 1 from jsonb_array_elements(previous_reviews) r where r ->> 'id' = submitted ->> 'id')
    then
      raise exception 'workflow_review_request_invalid' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.guard_workflow_owner_reviews() from public, anon, authenticated, service_role;
create trigger guard_workflow_owner_reviews_trigger
before insert or update on public.research_workflows
for each row execute function public.guard_workflow_owner_reviews();

alter table public.research_workflows enable row level security;
revoke all on table public.research_workflows from public, anon, authenticated, service_role;
grant select, insert, update on table public.research_workflows to authenticated;
drop policy if exists "research_workflows_delete_own" on public.research_workflows;
-- Existing owner/advisor SELECT/INSERT/UPDATE policies remain in force.
create or replace function public.enforce_student_advisor_workflow_progress()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_record record;
  old_rank integer;
  new_rank integer;
  new_state_rank integer;
  new_step_rank integer;
  old_reviews jsonb := coalesce(old.content -> 'advisorReviews', '[]'::jsonb);
  new_reviews jsonb := coalesce(new.content -> 'advisorReviews', '[]'::jsonb);
  submitted_review jsonb;
begin
  -- Service jobs and the linked advisor follow their existing policies/trigger.
  if auth.uid() is null or auth.uid() <> old.owner_id then
    return new;
  end if;

  select
    p.authoring_role,
    lower(nullif(btrim(p.advisor_email), '')) as advisor_email
  into project_record
  from public.projects p
  where p.id = old.project_id
    and p.owner_id = old.owner_id
    and p.deleted_at is null;

  if not found or project_record.authoring_role <> 'student' then
    return new;
  end if;

  old_rank := case old.stable_state::text
    when 'draft_prompt' then 0
    when 'choosing_problem' then 1
    when 'validating_general_objective' then 2
    when 'validating_specific_objectives' then 3
    when 'validating_literature' then 4
    when 'validating_development' then 5
    when 'validating_methodology' then 6
    when 'reviewing_map' then 7
    when 'completed' then 8
    else 0
  end;
  new_rank := case new.stable_state::text
    when 'draft_prompt' then 0
    when 'choosing_problem' then 1
    when 'validating_general_objective' then 2
    when 'validating_specific_objectives' then 3
    when 'validating_literature' then 4
    when 'validating_development' then 5
    when 'validating_methodology' then 6
    when 'reviewing_map' then 7
    when 'completed' then 8
    else 0
  end;
  new_state_rank := case new.state::text
    when 'draft_prompt' then 0
    when 'choosing_problem' then 1
    when 'validating_general_objective' then 2
    when 'validating_specific_objectives' then 3
    when 'validating_literature' then 4
    when 'validating_development' then 5
    when 'validating_methodology' then 6
    when 'reviewing_map' then 7
    when 'completed' then 8
    else 0
  end;
  new_step_rank := case new.content ->> 'activeStep'
    when 'problem_statement' then 1
    when 'general_objective' then 2
    when 'specific_objectives' then 3
    when 'literature_topics' then 4
    when 'development_topics' then 5
    when 'methodology_matrix' then 6
    else 0
  end;

  -- O proprietário pode iniciar a problemática, salvar e navegar para trás.
  -- Todo avanço posterior é reservado à aprovação feita pelo orientador.
  if new_rank > old_rank and new_rank > 1 then
    raise exception 'student_advisor_approval_required';
  end if;
  if new_state_rank > greatest(new_rank, 1)
    or new_step_rank > greatest(new_rank, 1)
  then
    raise exception 'student_workflow_progress_invalid';
  end if;

  if jsonb_typeof(old_reviews) <> 'array'
    or jsonb_typeof(new_reviews) <> 'array'
  then
    raise exception 'student_advisor_reviews_invalid';
  end if;

  if jsonb_array_length(new_reviews) > jsonb_array_length(old_reviews) then
    if jsonb_array_length(new_reviews) <> jsonb_array_length(old_reviews) + 1 then
      raise exception 'student_advisor_review_request_invalid';
    end if;

    submitted_review := new_reviews -> (jsonb_array_length(new_reviews) - 1);
    if submitted_review ->> 'status' is distinct from 'pending' then
      raise exception 'student_advisor_review_request_invalid';
    end if;
    if project_record.advisor_email is null then
      raise exception 'student_advisor_email_required';
    end if;
    if lower(nullif(btrim(submitted_review ->> 'advisorEmail'), ''))
      is distinct from project_record.advisor_email
    then
      raise exception 'student_advisor_email_mismatch';
    end if;

    if (
      -- C111: revisiting existing content requests review without losing progress.
      -- Keep the outer IS NOT TRUE guard: incomplete targets must still fail closed.
      (submitted_review ->> 'targetState' = old.state::text
        and submitted_review ->> 'targetStableState' = old.stable_state::text
        and (submitted_review -> 'targetActiveStep') is not distinct from (old.content -> 'activeStep')
        and case submitted_review ->> 'step'
          when 'problem_statement' then 1 when 'general_objective' then 2 when 'specific_objectives' then 3
          when 'literature_topics' then 4 when 'development_topics' then 5 when 'methodology_matrix' then 6 when 'final_map' then 7 else 999 end <= old_rank
        and jsonb_array_length(private.workflow_unit(old.content, submitted_review ->> 'step') -> 'elements') > 0)
      or (old.stable_state::text = 'choosing_problem'
        and submitted_review ->> 'step' = 'problem_statement'
        and submitted_review ->> 'targetState' = 'validating_general_objective'
        and submitted_review ->> 'targetStableState' = 'validating_general_objective'
        and submitted_review ->> 'targetActiveStep' = 'general_objective')
      or (old.stable_state::text = 'validating_general_objective'
        and submitted_review ->> 'step' = 'general_objective'
        and submitted_review ->> 'targetState' = 'validating_specific_objectives'
        and submitted_review ->> 'targetStableState' = 'validating_specific_objectives'
        and submitted_review ->> 'targetActiveStep' = 'specific_objectives')
      or (old.stable_state::text = 'validating_specific_objectives'
        and submitted_review ->> 'step' = 'specific_objectives'
        and submitted_review ->> 'targetState' = 'validating_literature'
        and submitted_review ->> 'targetStableState' = 'validating_literature'
        and submitted_review ->> 'targetActiveStep' = 'literature_topics')
      or (old.stable_state::text = 'validating_literature'
        and submitted_review ->> 'step' = 'literature_topics'
        and submitted_review ->> 'targetState' = 'validating_development'
        and submitted_review ->> 'targetStableState' = 'validating_development'
        and submitted_review ->> 'targetActiveStep' = 'development_topics')
      or (old.stable_state::text = 'validating_development'
        and submitted_review ->> 'step' = 'development_topics'
        and submitted_review ->> 'targetState' = 'validating_methodology'
        and submitted_review ->> 'targetStableState' = 'validating_methodology'
        and submitted_review ->> 'targetActiveStep' = 'methodology_matrix')
      or (old.stable_state::text = 'validating_methodology'
        and submitted_review ->> 'step' = 'methodology_matrix'
        and submitted_review ->> 'targetState' = 'reviewing_map'
        and submitted_review ->> 'targetStableState' = 'reviewing_map'
        and submitted_review ->> 'targetActiveStep' is null)
      or (old.stable_state::text = 'reviewing_map'
        and submitted_review ->> 'step' = 'final_map'
        and submitted_review ->> 'targetState' = 'completed'
        and submitted_review ->> 'targetStableState' = 'completed'
        and submitted_review ->> 'targetActiveStep' is null)
    ) is not true then
      raise exception 'student_advisor_review_transition_invalid';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_student_advisor_workflow_progress()
  from public, anon, authenticated, service_role;


commit;
