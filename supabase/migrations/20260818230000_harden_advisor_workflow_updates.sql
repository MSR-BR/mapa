-- Change 23: orientadores podem registrar apenas a revisão pendente.
-- A policy de UPDATE continua necessária para a rota autenticada, mas este
-- trigger impede alterações diretas à estrutura do estudante via Data API.
create or replace function public.restrict_advisor_workflow_update()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  old_reviews jsonb := coalesce(old.content -> 'advisorReviews', '[]'::jsonb);
  new_reviews jsonb := coalesce(new.content -> 'advisorReviews', '[]'::jsonb);
  old_item jsonb;
  new_item jsonb;
  pending_new_item jsonb;
  pending_id text := null;
  new_status text := null;
  target_state text;
  target_stable_state text;
  index integer;
begin
  -- O proprietário do projeto segue as regras normais de edição da aplicação.
  if auth.uid() is null or auth.uid() = old.owner_id then
    return new;
  end if;

  -- Só o orientador efetivamente vinculado pode alcançar este caminho.
  if not exists (
    select 1
    from public.projects p
    where p.id = old.project_id
      and p.owner_id = old.owner_id
      and p.deleted_at is null
      and (
        p.advisor_id = auth.uid()
        or (
          p.advisor_email is not null
          and lower(p.advisor_email) = lower(auth.jwt() ->> 'email')
        )
      )
  ) then
    raise exception 'advisor_workflow_update_not_allowed';
  end if;

  -- Colunas de propriedade, versionamento e validação do estudante não podem
  -- ser forjadas por um orientador.
  if new.project_id is distinct from old.project_id
    or new.owner_id is distinct from old.owner_id
    or new.schema_version is distinct from old.schema_version
    or new.source_revision is distinct from old.source_revision
    or new.validation_state is distinct from old.validation_state
    or new.created_at is distinct from old.created_at
    or new.revision <> old.revision + 1
    or new.updated_at < old.updated_at
  then
    raise exception 'advisor_workflow_immutable_fields';
  end if;

  -- O conteúdo acadêmico só pode permanecer igual, exceto pelo activeStep de
  -- uma aprovação e pelo registro da revisão do orientador.
  if (new.content - 'advisorReviews' - 'activeStep')
    is distinct from (old.content - 'advisorReviews' - 'activeStep')
  then
    raise exception 'advisor_workflow_content_not_allowed';
  end if;

  if jsonb_typeof(old_reviews) <> 'array'
    or jsonb_typeof(new_reviews) <> 'array'
    or jsonb_array_length(old_reviews) <> jsonb_array_length(new_reviews)
  then
    raise exception 'advisor_workflow_reviews_invalid';
  end if;

  -- A rota só pode operar sobre a única revisão pendente atual.
  for index in 0 .. jsonb_array_length(old_reviews) - 1 loop
    old_item := old_reviews -> index;
    if old_item ->> 'status' = 'pending' then
      if pending_id is not null then
        raise exception 'advisor_workflow_multiple_pending_reviews';
      end if;
      pending_id := old_item ->> 'id';
    end if;
  end loop;
  if pending_id is null then
    raise exception 'advisor_workflow_no_pending_review';
  end if;

  for index in 0 .. jsonb_array_length(old_reviews) - 1 loop
    old_item := old_reviews -> index;
    new_item := new_reviews -> index;
    if (old_item ->> 'id') is distinct from (new_item ->> 'id') then
      raise exception 'advisor_workflow_review_order_changed';
    end if;
    if old_item ->> 'id' <> pending_id then
      if old_item is distinct from new_item then
        raise exception 'advisor_workflow_previous_review_changed';
      end if;
      continue;
    end if;

    if (new_item - array['advisorComments', 'advisorId', 'reviewedAt', 'status'])
      is distinct from (old_item - array['advisorComments', 'advisorId', 'reviewedAt', 'status'])
      or (new_item ->> 'advisorId') is distinct from (auth.uid()::text)
    then
      raise exception 'advisor_workflow_review_fields_changed';
    end if;
    if new_item ->> 'advisorComments' is not null
      and char_length(new_item ->> 'advisorComments') > 2000
    then
      raise exception 'advisor_workflow_comment_too_long';
    end if;
    new_status := new_item ->> 'status';
    target_state := new_item ->> 'targetState';
    target_stable_state := new_item ->> 'targetStableState';
    pending_new_item := new_item;
  end loop;

  if new_status = 'pending' then
    if new.state is distinct from old.state
      or new.stable_state is distinct from old.stable_state
      or (new.content -> 'activeStep') is distinct from (old.content -> 'activeStep')
      or pending_new_item ->> 'reviewedAt' is not null
    then
      raise exception 'advisor_workflow_comment_transition_invalid';
    end if;
  elsif new_status = 'changes_requested' then
    if new.state is distinct from old.state
      or new.stable_state is distinct from old.stable_state
      or (new.content -> 'activeStep') is distinct from (old.content -> 'activeStep')
      or pending_new_item ->> 'reviewedAt' is null
    then
      raise exception 'advisor_workflow_changes_transition_invalid';
    end if;
  elsif new_status = 'approved' then
    if new.state::text is distinct from target_state
      or new.stable_state::text is distinct from target_stable_state
      or (new.content -> 'activeStep') is distinct from (pending_new_item -> 'targetActiveStep')
      or pending_new_item ->> 'reviewedAt' is null
    then
      raise exception 'advisor_workflow_approval_transition_invalid';
    end if;
  else
    raise exception 'advisor_workflow_review_status_invalid';
  end if;

  return new;
end;
$$;

revoke all on function public.restrict_advisor_workflow_update() from public;

drop trigger if exists restrict_advisor_workflow_update_trigger on public.research_workflows;
create trigger restrict_advisor_workflow_update_trigger
before update on public.research_workflows
for each row
execute function public.restrict_advisor_workflow_update();
