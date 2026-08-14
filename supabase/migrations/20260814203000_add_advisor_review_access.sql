alter table public.projects
  add column if not exists advisor_email text,
  add column if not exists advisor_id uuid references auth.users (id) on delete set null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_advisor_email_length'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects
      add constraint projects_advisor_email_length check (
        advisor_email is null or char_length(advisor_email) <= 320
      );
  end if;
end
$$;

comment on column public.projects.advisor_email is
  'E-mail da conta do orientador que pode revisar e aprovar etapas do Mapa v2.';

comment on column public.projects.advisor_id is
  'Identificador opcional da conta do orientador, preenchido quando disponível.';

create index if not exists projects_advisor_email_idx
  on public.projects (lower(advisor_email))
  where advisor_email is not null and deleted_at is null;

drop policy if exists "projects_select_advised" on public.projects;

create policy "projects_select_advised"
  on public.projects
  for select
  to authenticated
  using (
    (select auth.uid()) is not null
    and advisor_email is not null
    and lower(advisor_email) = lower((select auth.jwt() ->> 'email'))
  );

drop policy if exists "research_workflows_select_advised" on public.research_workflows;

create policy "research_workflows_select_advised"
  on public.research_workflows
  for select
  to authenticated
  using (
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.projects p
      where p.id = research_workflows.project_id
        and p.owner_id = research_workflows.owner_id
        and p.deleted_at is null
        and p.advisor_email is not null
        and lower(p.advisor_email) = lower((select auth.jwt() ->> 'email'))
    )
  );

drop policy if exists "research_workflows_update_advised" on public.research_workflows;

create policy "research_workflows_update_advised"
  on public.research_workflows
  for update
  to authenticated
  using (
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.projects p
      where p.id = research_workflows.project_id
        and p.owner_id = research_workflows.owner_id
        and p.deleted_at is null
        and p.advisor_email is not null
        and lower(p.advisor_email) = lower((select auth.jwt() ->> 'email'))
    )
  )
  with check (
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.projects p
      where p.id = research_workflows.project_id
        and p.owner_id = research_workflows.owner_id
        and p.deleted_at is null
        and p.advisor_email is not null
        and lower(p.advisor_email) = lower((select auth.jwt() ->> 'email'))
    )
  );
