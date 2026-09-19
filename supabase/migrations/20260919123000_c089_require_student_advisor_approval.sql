begin;

-- Change 089: projetos criados no modo Aluno podem salvar rascunhos e voltar,
-- mas qualquer avanço após a escolha inicial precisa acontecer pela aprovação
-- da revisão pendente, executada pelo orientador vinculado.
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
    if submitted_review ->> 'status' <> 'pending' then
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

    if not (
      (old.stable_state::text = 'choosing_problem'
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
    ) then
      raise exception 'student_advisor_review_transition_invalid';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_student_advisor_workflow_progress()
  from public, anon, authenticated, service_role;

drop trigger if exists enforce_student_advisor_workflow_progress_trigger
  on public.research_workflows;
create trigger enforce_student_advisor_workflow_progress_trigger
before update on public.research_workflows
for each row
execute function public.enforce_student_advisor_workflow_progress();

commit;
