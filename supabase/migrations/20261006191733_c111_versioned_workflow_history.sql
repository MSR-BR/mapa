begin;
lock table public.research_workflows in share row exclusive mode;
create temporary table c111_before on commit drop as
select project_id,revision,content,md5((content - array['elementVersions','historyVersion','stepDrafts','stepProposals'])::text) as academic_hash
from public.research_workflows;

-- C111: immutable, paginated history. Only the trigger writes historical bodies.
create table if not exists public.workflow_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.research_workflows(project_id) on delete cascade deferrable initially deferred,
  revision bigint not null,
  source_revision bigint not null,
  step text not null check (step in ('problem_statement','general_objective','specific_objectives','literature_topics','development_topics','methodology_matrix','final_map','legacy')),
  kind text not null check (kind in ('current','draft','proposal','legacy')),
  entry_key text not null default '',
  actor_id uuid,
  created_at timestamptz not null default now(),
  reason text not null,
  unit jsonb not null,
  unique(project_id, revision, step, kind, entry_key)
);
create index if not exists workflow_versions_project_step_cursor_idx
  on public.workflow_versions(project_id, step, created_at desc, id desc);
alter table public.workflow_versions enable row level security;
revoke all on table public.workflow_versions from public, anon, authenticated, service_role;
grant select on table public.workflow_versions to authenticated;
drop policy if exists workflow_versions_select_authorized on public.workflow_versions;
create policy workflow_versions_select_authorized on public.workflow_versions
for select to authenticated using (
  exists (select 1 from public.research_workflows w
    join public.projects p on p.id = w.project_id
    where w.project_id = workflow_versions.project_id and p.deleted_at is null)
);

create or replace function private.workflow_unit(body jsonb, target text)
returns jsonb language sql immutable security invoker set search_path = '' as $$
  with selected as (
    select coalesce(jsonb_agg(e.value order by e.ordinality), '[]'::jsonb) as elements
    from jsonb_array_elements(coalesce(body->'elements','[]'::jsonb)) with ordinality e
    where e.value->>'type' = any(case target
      when 'problem_statement' then array['problem_statement']
      when 'general_objective' then array['general_objective']
      when 'specific_objectives' then array['general_objective','specific_objective']
      when 'literature_topics' then array['literature_topic']
      when 'development_topics' then array['development_topic']
      when 'methodology_matrix' then array['research_title','methodology_mapping']
      when 'final_map' then array['final_map'] else array[]::text[] end)
  ), ids as (select e->>'id' as id from selected, jsonb_array_elements(elements) e
    union select r->>'id' from jsonb_array_elements(coalesce(body->'methodologyRows','[]'::jsonb)) r where target='methodology_matrix')
  select jsonb_build_object(
    'elements',selected.elements,
    'chapterTopicDetails',coalesce((select jsonb_agg(d) from jsonb_array_elements(coalesce(body->'chapterTopicDetails','[]'::jsonb)) d where d->>'topicId' in (select id from ids)), '[]'::jsonb),
    'methodologyClassification',case when target='methodology_matrix' then coalesce(body->'methodologyClassification','null'::jsonb) else 'null'::jsonb end,
    'methodologyRows',case when target='methodology_matrix' then coalesce(body->'methodologyRows','[]'::jsonb) else '[]'::jsonb end,
    'traceLinks',coalesce((select jsonb_agg(l) from jsonb_array_elements(coalesce(body->'traceLinks','[]'::jsonb)) l where l->>'fromElementId' in (select id from ids) or l->>'toElementId' in (select id from ids)), '[]'::jsonb)
  ) from selected
$$;
revoke all on function private.workflow_unit(jsonb,text) from public, anon, authenticated, service_role;

-- Normalize bookkeeping so an unchanged save cannot grow history.
create or replace function private.workflow_unit_fingerprint(unit jsonb)
returns jsonb language sql immutable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'elements',coalesce((select jsonb_agg(e - array['revision','sourceRevision','updatedBy']) from jsonb_array_elements(coalesce(unit->'elements','[]'::jsonb)) e),'[]'::jsonb),
    'chapterTopicDetails',unit->'chapterTopicDetails',
    'methodologyClassification',case when jsonb_typeof(unit->'methodologyClassification')='object' then (unit->'methodologyClassification') - array['revision','sourceRevision','updatedBy'] else 'null'::jsonb end,
    'methodologyRows',coalesce((select jsonb_agg(e - array['revision','sourceRevision','updatedBy']) from jsonb_array_elements(coalesce(unit->'methodologyRows','[]'::jsonb)) e),'[]'::jsonb),
    'traceLinks',coalesce((select jsonb_agg(e - 'sourceRevision') from jsonb_array_elements(coalesce(unit->'traceLinks','[]'::jsonb)) e),'[]'::jsonb)
  )
$$;
revoke all on function private.workflow_unit_fingerprint(jsonb) from public, anon, authenticated, service_role;

-- Preserve every legacy entry, including duplicates, with its original body.
insert into public.workflow_versions(project_id, revision, source_revision, step, kind, entry_key, actor_id, created_at, reason, unit)
select w.project_id, w.revision, coalesce((e.value->>'sourceRevision')::bigint,w.source_revision), 'legacy', 'legacy', e.ordinality::text, null,
  coalesce((e.value->>'archivedAt')::timestamptz,w.updated_at), 'Histórico anterior à C111; metadados de relações não eram versionados.', e.value
from public.research_workflows w,
  jsonb_array_elements(coalesce(w.content->'elementVersions','[]'::jsonb)) with ordinality e
on conflict(project_id, revision, step, kind, entry_key) do nothing;

-- Baseline by unit, not one copy of the whole project.
insert into public.workflow_versions(project_id, revision, source_revision, step, kind, actor_id, reason, unit)
select w.project_id,w.revision,w.source_revision,t.step,'current',null,'Versão vigente ao iniciar o histórico.',private.workflow_unit(w.content,t.step)
from public.research_workflows w cross join unnest(array['problem_statement','general_objective','specific_objectives','literature_topics','development_topics','methodology_matrix','final_map']) t(step)
where jsonb_array_length(private.workflow_unit(w.content,t.step)->'elements') > 0
on conflict(project_id, revision, step, kind, entry_key) do nothing;

-- Idempotent extraction under a write lock. The owner-auth guard is restored before commit.
alter table public.research_workflows disable trigger restrict_advisor_workflow_update_trigger;
update public.research_workflows set content = content || jsonb_build_object(
  'historyVersion',1,'elementVersions','[]'::jsonb,
  'stepDrafts',coalesce(content->'stepDrafts','{}'::jsonb),
  'stepProposals',coalesce(content->'stepProposals','{}'::jsonb))
where content->>'historyVersion' is distinct from '1' or jsonb_array_length(coalesce(content->'elementVersions','[]'::jsonb)) > 0;
alter table public.research_workflows enable trigger restrict_advisor_workflow_update_trigger;

create or replace function private.capture_workflow_versions()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  target text;
  old_unit jsonb;
  new_unit jsonb;
  bucket text;
  version_kind text;
begin
  -- RLS already authorized the row update; additionally bind history to its actor.
  if auth.uid() is not null and auth.uid() <> new.owner_id
    and not private.project_reviewable_by_active_advisor(new.project_id,new.owner_id) then
    raise exception 'workflow_history_actor_denied';
  end if;
  if tg_op = 'UPDATE' then
    -- Old application versions cannot drop the new drafts during rollback.
    if old.content->>'historyVersion'='1' and new.content->>'historyVersion' is distinct from '1' then
      raise exception 'workflow_client_upgrade_required';
    end if;
    if auth.uid() = old.owner_id and exists (
      select 1 from jsonb_array_elements(coalesce(old.content->'advisorReviews','[]'::jsonb)) r where r->>'status'='pending'
    ) and new.content is distinct from old.content then
      raise exception 'workflow_submitted_revision_frozen';
    end if;
  end if;
  foreach target in array array['problem_statement','general_objective','specific_objectives','literature_topics','development_topics','methodology_matrix','final_map'] loop
    foreach bucket in array array['current','stepDrafts','stepProposals'] loop
      version_kind := case bucket when 'stepDrafts' then 'draft' when 'stepProposals' then 'proposal' else 'current' end;
      old_unit := null;
      if tg_op = 'UPDATE' then
        old_unit := case when bucket='current' then private.workflow_unit(old.content,target) else old.content->bucket->target->'unit' end;
      end if;
      new_unit := case when bucket='current' then private.workflow_unit(new.content,target) else new.content->bucket->target->'unit' end;
      if new_unit is not null and new_unit <> 'null'::jsonb
        and (private.workflow_unit_fingerprint(new_unit) is distinct from private.workflow_unit_fingerprint(old_unit)
          or (tg_op='UPDATE' and bucket<>'current' and (new.content->bucket->target->>'baseRevision') is distinct from (old.content->bucket->target->>'baseRevision')))
        and (jsonb_array_length(new_unit->'elements')>0 or old_unit is not null) then
        insert into public.workflow_versions(project_id,revision,source_revision,step,kind,actor_id,reason,unit)
        values(new.project_id,new.revision,case when bucket='current' then new.source_revision else coalesce((new.content->bucket->target->>'baseRevision')::bigint,new.source_revision) end,target,version_kind,auth.uid(),
          case version_kind when 'draft' then 'Rascunho salvo' when 'proposal' then 'Proposta da IA' else 'Conteúdo confirmado ou atualizado' end,new_unit)
        on conflict(project_id,revision,step,kind,entry_key) do nothing;
      end if;
    end loop;
  end loop;
  new.content := new.content || jsonb_build_object('historyVersion',1,'elementVersions','[]'::jsonb);
  return new;
end;
$$;
revoke all on function private.capture_workflow_versions() from public, anon, authenticated, service_role;
drop trigger if exists zz_capture_workflow_versions on public.research_workflows;
create trigger zz_capture_workflow_versions before insert or update on public.research_workflows
for each row execute function private.capture_workflow_versions();

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
      (submitted_review ->> 'targetState' = old.state::text
        and submitted_review ->> 'targetStableState' = old.stable_state::text
        and (submitted_review -> 'targetActiveStep') is not distinct from (old.content -> 'activeStep')
        and case submitted_review ->> 'step'
          when 'problem_statement' then 1 when 'general_objective' then 2 when 'specific_objectives' then 3
          when 'literature_topics' then 4 when 'development_topics' then 5 when 'methodology_matrix' then 6 when 'final_map' then 7 else 999 end <= old_rank
        and jsonb_array_length(private.workflow_unit(old.content,submitted_review->>'step')->'elements')>0)
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
    ) then
      raise exception 'student_advisor_review_transition_invalid';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_student_advisor_workflow_progress()
  from public, anon, authenticated, service_role;

-- Fail the entire transaction if any academic body or legacy entry changed.
do $$ begin
  if exists (select 1 from c111_before b join public.research_workflows w using(project_id)
    where b.academic_hash <> md5((w.content - array['elementVersions','historyVersion','stepDrafts','stepProposals'])::text)) then
    raise exception 'c111_academic_content_mismatch';
  end if;
  if exists (select 1 from c111_before b, jsonb_array_elements(coalesce(b.content->'elementVersions','[]'::jsonb)) with ordinality e
    where not exists (select 1 from public.workflow_versions v where v.project_id=b.project_id and v.revision=b.revision and v.kind='legacy' and v.entry_key=e.ordinality::text and v.unit=e.value)) then
    raise exception 'c111_legacy_version_mismatch';
  end if;
end $$;
commit;
