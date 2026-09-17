begin;

-- C087 rollout phase 2: enforce mode + authorship + relationship in PostgreSQL,
-- so direct Data API access cannot bypass the server-side actor policy.
do $$
begin
  if to_regclass('public.user_profiles') is null
    or to_regclass('public.projects') is null
    or to_regclass('public.research_workflows') is null
    or to_regclass('public.generation_jobs') is null
    or to_regclass('public.research_structures') is null
    or to_regclass('public.legal_consents') is null
  then
    raise exception 'c087_required_tables_missing';
  end if;

  if to_regprocedure('public.switch_active_role(text,bigint,uuid)') is null
    or not has_function_privilege(
      'authenticated',
      'public.switch_active_role(text,bigint,uuid)',
      'EXECUTE'
    )
  then
    raise exception 'c087_switch_rpc_not_released';
  end if;

  if exists (
    select 1 from public.projects
    where authoring_role not in ('student', 'advisor')
  ) then
    raise exception 'c087_invalid_project_authoring_role';
  end if;

  if exists (
    select 1 from public.projects
    where authoring_role = 'advisor'
      and (advisor_id is not null or advisor_email is not null)
  ) then
    raise exception 'c087_advisor_project_has_supervision';
  end if;
end
$$;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.current_active_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select up.active_role
  from public.user_profiles up
  where up.user_id = (select auth.uid())
    and up.active_role in ('student', 'advisor')
$$;

create or replace function private.project_owned_in_active_mode(
  target_project_id uuid,
  target_owner_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and target_owner_id = (select auth.uid())
    and exists (
      select 1
      from public.projects p
      where p.id = target_project_id
        and p.owner_id = target_owner_id
        and p.authoring_role = (select private.current_active_role())
    )
$$;

create or replace function private.project_reviewable_by_active_advisor(
  target_project_id uuid,
  target_owner_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (select private.current_active_role()) = 'advisor'
    and exists (
      select 1
      from public.projects p
      where p.id = target_project_id
        and p.owner_id = target_owner_id
        and p.owner_id <> (select auth.uid())
        and p.authoring_role = 'student'
        and p.advisor_id = (select auth.uid())
        and p.deleted_at is null
    )
$$;

comment on function private.current_active_role() is
  'Retorna somente o modo ativo da própria auth.uid() para autorização RLS.';
comment on function private.project_owned_in_active_mode(uuid, uuid) is
  'Confirma propriedade e autoria compatível com o modo ativo da própria auth.uid().';
comment on function private.project_reviewable_by_active_advisor(uuid, uuid) is
  'Confirma modo Orientador e vínculo real com projeto estudantil de terceiro.';

revoke all on function private.current_active_role()
  from public, anon, authenticated, service_role;
revoke all on function private.project_owned_in_active_mode(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke all on function private.project_reviewable_by_active_advisor(uuid, uuid)
  from public, anon, authenticated, service_role;
grant execute on function private.current_active_role() to authenticated;
grant execute on function private.project_owned_in_active_mode(uuid, uuid) to authenticated;
grant execute on function private.project_reviewable_by_active_advisor(uuid, uuid) to authenticated;

create or replace function public.set_project_advisor(
  project_id_input uuid,
  advisor_email_input text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  resolved_role text;
  current_email text;
  normalized_email text := lower(nullif(btrim(advisor_email_input), ''));
  project_authoring_role text;
  resolved_advisor_id uuid := null;
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  select up.active_role into resolved_role
  from public.user_profiles up
  where up.user_id = current_user_id;

  if resolved_role is distinct from 'student' then
    raise exception 'student_mode_required';
  end if;

  select p.authoring_role into project_authoring_role
  from public.projects p
  where p.id = project_id_input
    and p.owner_id = current_user_id
    and p.deleted_at is null
  for update;

  if not found then
    raise exception 'project_not_found_or_not_owned';
  end if;
  if project_authoring_role <> 'student' then
    raise exception 'student_authored_project_required';
  end if;

  select lower(nullif(btrim(u.email), '')) into current_email
  from auth.users u
  where u.id = current_user_id;

  if normalized_email is not null and normalized_email = current_email then
    raise exception 'self_advising_not_allowed';
  end if;

  if normalized_email is not null then
    select u.id into resolved_advisor_id
    from auth.users u
    where lower(u.email) = normalized_email
    order by u.created_at asc
    limit 1;

    if resolved_advisor_id = current_user_id then
      raise exception 'self_advising_not_allowed';
    end if;
  end if;

  update public.projects p
  set advisor_email = normalized_email,
      advisor_id = resolved_advisor_id,
      updated_at = statement_timestamp()
  where p.id = project_id_input
    and p.owner_id = current_user_id
    and p.authoring_role = 'student'
    and p.deleted_at is null;

  if not found then
    raise exception 'project_not_found_or_not_owned';
  end if;

  return resolved_advisor_id is not null;
end;
$$;

create or replace function public.claim_pending_advisor_projects()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  resolved_role text;
  current_email text;
  updated_count integer := 0;
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  select up.active_role into resolved_role
  from public.user_profiles up
  where up.user_id = current_user_id;

  if resolved_role is distinct from 'advisor' then
    raise exception 'advisor_mode_required';
  end if;

  select lower(nullif(btrim(u.email), '')) into current_email
  from auth.users u
  where u.id = current_user_id;

  if current_email is null then
    return 0;
  end if;

  update public.projects p
  set advisor_id = current_user_id,
      updated_at = statement_timestamp()
  where p.authoring_role = 'student'
    and p.owner_id <> current_user_id
    and p.deleted_at is null
    and p.advisor_id is null
    and p.advisor_email is not null
    and lower(p.advisor_email) = current_email;

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

comment on function public.set_project_advisor(uuid, text) is
  'Vincula orientador somente a projeto estudantil do proprietário no modo Aluno e bloqueia auto-orientação.';
comment on function public.claim_pending_advisor_projects() is
  'Vincula convites pendentes apenas no modo Orientador e somente a projetos estudantis de terceiros.';

revoke all on function public.set_project_advisor(uuid, text)
  from public, anon, authenticated, service_role;
revoke all on function public.claim_pending_advisor_projects()
  from public, anon, authenticated, service_role;
grant execute on function public.set_project_advisor(uuid, text) to authenticated;
grant execute on function public.claim_pending_advisor_projects() to authenticated;

-- The profile is directly readable/initializable, but only the RPC can change
-- its active mode.
revoke all on table public.user_profiles from public, anon;
revoke update, delete on table public.user_profiles from authenticated;
grant select, insert on table public.user_profiles to authenticated;
drop policy if exists "user_profiles_select_own" on public.user_profiles;
drop policy if exists "user_profiles_insert_own" on public.user_profiles;
drop policy if exists "user_profiles_update_own" on public.user_profiles;
create policy "user_profiles_select_own" on public.user_profiles
  for select to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()));
create policy "user_profiles_insert_own" on public.user_profiles
  for insert to authenticated
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

revoke all on table public.user_profile_role_events
  from public, anon, authenticated;
grant select on table public.user_profile_role_events to service_role;

-- Supervision columns can only be changed by set_project_advisor().
revoke all on table public.projects from public, anon;
revoke update on table public.projects from authenticated;
grant select, insert, delete on table public.projects to authenticated;
grant update (
  title, theme, problem_statement, keywords, knowledge_area, academic_level,
  status, updated_at, deleted_at, workflow_version
) on table public.projects to authenticated;

drop policy if exists "projects_select_own" on public.projects;
drop policy if exists "projects_insert_own" on public.projects;
drop policy if exists "projects_update_own" on public.projects;
drop policy if exists "projects_delete_own" on public.projects;
drop policy if exists "projects_select_advised" on public.projects;

create policy "projects_select_own" on public.projects
  for select to authenticated
  using ((select private.project_owned_in_active_mode(id, owner_id)));
create policy "projects_insert_own" on public.projects
  for insert to authenticated
  with check (
    (select auth.uid()) is not null
    and owner_id = (select auth.uid())
    and authoring_role = (select private.current_active_role())
  );
create policy "projects_update_own" on public.projects
  for update to authenticated
  using ((select private.project_owned_in_active_mode(id, owner_id)))
  with check ((select private.project_owned_in_active_mode(id, owner_id)));
create policy "projects_delete_own" on public.projects
  for delete to authenticated
  using ((select private.project_owned_in_active_mode(id, owner_id)));
create policy "projects_select_advised" on public.projects
  for select to authenticated
  using ((select private.project_reviewable_by_active_advisor(id, owner_id)));

create index if not exists projects_owner_authoring_updated_idx
  on public.projects (owner_id, authoring_role, updated_at desc);
create index if not exists projects_advisor_authoring_idx
  on public.projects (advisor_id, authoring_role)
  where advisor_id is not null and deleted_at is null;
create index if not exists projects_pending_advisor_email_idx
  on public.projects (lower(advisor_email))
  where advisor_id is null
    and advisor_email is not null
    and authoring_role = 'student'
    and deleted_at is null;

-- Owned child resources are always authorized through their parent project.
revoke all on table public.research_workflows from public, anon;
grant select, insert, update, delete on table public.research_workflows to authenticated;
drop policy if exists "research_workflows_select_own" on public.research_workflows;
drop policy if exists "research_workflows_insert_own" on public.research_workflows;
drop policy if exists "research_workflows_update_own" on public.research_workflows;
drop policy if exists "research_workflows_delete_own" on public.research_workflows;
drop policy if exists "research_workflows_select_advised" on public.research_workflows;
drop policy if exists "research_workflows_update_advised" on public.research_workflows;
create policy "research_workflows_select_own" on public.research_workflows
  for select to authenticated
  using ((select private.project_owned_in_active_mode(project_id, owner_id)));
create policy "research_workflows_insert_own" on public.research_workflows
  for insert to authenticated
  with check ((select private.project_owned_in_active_mode(project_id, owner_id)));
create policy "research_workflows_update_own" on public.research_workflows
  for update to authenticated
  using ((select private.project_owned_in_active_mode(project_id, owner_id)))
  with check ((select private.project_owned_in_active_mode(project_id, owner_id)));
create policy "research_workflows_delete_own" on public.research_workflows
  for delete to authenticated
  using ((select private.project_owned_in_active_mode(project_id, owner_id)));
create policy "research_workflows_select_advised" on public.research_workflows
  for select to authenticated
  using ((select private.project_reviewable_by_active_advisor(project_id, owner_id)));
create policy "research_workflows_update_advised" on public.research_workflows
  for update to authenticated
  using ((select private.project_reviewable_by_active_advisor(project_id, owner_id)))
  with check ((select private.project_reviewable_by_active_advisor(project_id, owner_id)));

revoke all on table public.generation_jobs from public, anon;
grant select, insert, update, delete on table public.generation_jobs to authenticated;
drop policy if exists "generation_jobs_select_own" on public.generation_jobs;
drop policy if exists "generation_jobs_insert_own" on public.generation_jobs;
drop policy if exists "generation_jobs_update_own" on public.generation_jobs;
drop policy if exists "generation_jobs_delete_own" on public.generation_jobs;
create policy "generation_jobs_select_own" on public.generation_jobs
  for select to authenticated
  using ((select private.project_owned_in_active_mode(project_id, owner_id)));
create policy "generation_jobs_insert_own" on public.generation_jobs
  for insert to authenticated
  with check ((select private.project_owned_in_active_mode(project_id, owner_id)));
create policy "generation_jobs_update_own" on public.generation_jobs
  for update to authenticated
  using ((select private.project_owned_in_active_mode(project_id, owner_id)))
  with check ((select private.project_owned_in_active_mode(project_id, owner_id)));
create policy "generation_jobs_delete_own" on public.generation_jobs
  for delete to authenticated
  using ((select private.project_owned_in_active_mode(project_id, owner_id)));

revoke all on table public.research_structures from public, anon;
grant select, insert, update, delete on table public.research_structures to authenticated;
drop policy if exists "research_structures_select_own" on public.research_structures;
drop policy if exists "research_structures_insert_own" on public.research_structures;
drop policy if exists "research_structures_update_own" on public.research_structures;
drop policy if exists "research_structures_delete_own" on public.research_structures;
create policy "research_structures_select_own" on public.research_structures
  for select to authenticated
  using ((select private.project_owned_in_active_mode(project_id, owner_id)));
create policy "research_structures_insert_own" on public.research_structures
  for insert to authenticated
  with check ((select private.project_owned_in_active_mode(project_id, owner_id)));
create policy "research_structures_update_own" on public.research_structures
  for update to authenticated
  using ((select private.project_owned_in_active_mode(project_id, owner_id)))
  with check ((select private.project_owned_in_active_mode(project_id, owner_id)));
create policy "research_structures_delete_own" on public.research_structures
  for delete to authenticated
  using ((select private.project_owned_in_active_mode(project_id, owner_id)));

-- Both consent rows remain stored; direct access follows only the active mode.
revoke all on table public.legal_consents from public, anon;
grant select, insert, update on table public.legal_consents to authenticated;
drop policy if exists "legal_consents_select_own" on public.legal_consents;
drop policy if exists "legal_consents_insert_own" on public.legal_consents;
drop policy if exists "legal_consents_update_own" on public.legal_consents;
create policy "legal_consents_select_own" on public.legal_consents
  for select to authenticated
  using (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
    and profile_role = (select private.current_active_role())
  );
create policy "legal_consents_insert_own" on public.legal_consents
  for insert to authenticated
  with check (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
    and profile_role = (select private.current_active_role())
  );
create policy "legal_consents_update_own" on public.legal_consents
  for update to authenticated
  using (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
    and profile_role = (select private.current_active_role())
  )
  with check (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
    and profile_role = (select private.current_active_role())
  );

create or replace function public.restrict_advisor_workflow_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  resolved_role text;
  project_record public.projects%rowtype;
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
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  if new.project_id is distinct from old.project_id
    or new.owner_id is distinct from old.owner_id
    or new.schema_version is distinct from old.schema_version
    or new.created_at is distinct from old.created_at
  then
    raise exception 'workflow_identity_fields_immutable';
  end if;

  select p.* into project_record
  from public.projects p
  where p.id = old.project_id
    and p.owner_id = old.owner_id
    and p.deleted_at is null;

  if not found then
    raise exception 'workflow_project_not_available';
  end if;

  select up.active_role into resolved_role
  from public.user_profiles up
  where up.user_id = current_user_id;

  if current_user_id = old.owner_id then
    if resolved_role is distinct from project_record.authoring_role then
      raise exception 'project_mode_mismatch';
    end if;
    return new;
  end if;

  if resolved_role is distinct from 'advisor'
    or project_record.authoring_role <> 'student'
    or project_record.owner_id = current_user_id
    or project_record.advisor_id is distinct from current_user_id
  then
    raise exception 'advisor_workflow_update_not_allowed';
  end if;

  if new.source_revision is distinct from old.source_revision
    or new.validation_state is distinct from old.validation_state
    or new.revision <> old.revision + 1
    or new.updated_at < old.updated_at
  then
    raise exception 'advisor_workflow_immutable_fields';
  end if;

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
      or (new_item ->> 'advisorId') is distinct from current_user_id::text
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

revoke all on function public.restrict_advisor_workflow_update()
  from public, anon, authenticated, service_role;
drop trigger if exists restrict_advisor_workflow_update_trigger
  on public.research_workflows;
create trigger restrict_advisor_workflow_update_trigger
before update on public.research_workflows
for each row execute function public.restrict_advisor_workflow_update();

-- Reassert all API-facing function privileges after CREATE OR REPLACE.
revoke all on function public.switch_active_role(text, bigint, uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.set_project_advisor(uuid, text)
  from public, anon, authenticated, service_role;
revoke all on function public.claim_pending_advisor_projects()
  from public, anon, authenticated, service_role;
grant execute on function public.switch_active_role(text, bigint, uuid) to authenticated;
grant execute on function public.set_project_advisor(uuid, text) to authenticated;
grant execute on function public.claim_pending_advisor_projects() to authenticated;
revoke update on table public.user_profiles from authenticated;

commit;
