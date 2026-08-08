-- Migration version recorded remotely: 20260807225154.
alter table public.projects
  add column workflow_version smallint not null default 1,
  add constraint projects_workflow_version_check
    check (workflow_version in (1, 2)),
  add constraint projects_id_owner_unique
    unique (id, owner_id);

comment on column public.projects.workflow_version is
  'Versão da jornada do projeto. Projetos legados permanecem na versão 1.';

create table public.research_workflows (
  project_id uuid primary key,
  owner_id uuid not null,
  schema_version text not null default '2.0.0',
  state text not null default 'draft_prompt',
  stable_state text not null default 'draft_prompt',
  revision integer not null default 1,
  source_revision integer not null default 1,
  content jsonb not null default '{}'::jsonb,
  validation_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint research_workflows_project_owner_fkey
    foreign key (project_id, owner_id)
    references public.projects (id, owner_id)
    on delete cascade,
  constraint research_workflows_schema_version_check
    check (schema_version = '2.0.0'),
  constraint research_workflows_state_check
    check (state in (
      'draft_prompt',
      'discovering',
      'choosing_problem',
      'validating_general_objective',
      'validating_specific_objectives',
      'validating_literature',
      'validating_development',
      'validating_methodology',
      'reviewing_map',
      'completed',
      'failed'
    )),
  constraint research_workflows_stable_state_check
    check (stable_state in (
      'draft_prompt',
      'choosing_problem',
      'validating_general_objective',
      'validating_specific_objectives',
      'validating_literature',
      'validating_development',
      'validating_methodology',
      'reviewing_map',
      'completed'
    )),
  constraint research_workflows_revision_check
    check (revision > 0 and source_revision > 0),
  constraint research_workflows_content_object_check
    check (jsonb_typeof(content) = 'object'),
  constraint research_workflows_validation_object_check
    check (jsonb_typeof(validation_state) = 'object'),
  constraint research_workflows_timestamps_order_check
    check (updated_at >= created_at)
);

comment on table public.research_workflows is
  'Estado persistido e versionado da jornada progressiva Mapa da Pesquisa v2.';
comment on column public.research_workflows.stable_state is
  'Último estado estável para recuperação após falha de operação externa.';
comment on column public.research_workflows.source_revision is
  'Versão das entradas validadas usada para detectar descendentes desatualizados.';

create index research_workflows_owner_updated_idx
  on public.research_workflows (owner_id, updated_at desc);

alter table public.research_workflows enable row level security;

revoke all on table public.research_workflows from anon;
grant select, insert, update, delete on table public.research_workflows to authenticated;

create policy "research_workflows_select_own"
  on public.research_workflows
  for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

create policy "research_workflows_insert_own"
  on public.research_workflows
  for insert
  to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

create policy "research_workflows_update_own"
  on public.research_workflows
  for update
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = owner_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

create policy "research_workflows_delete_own"
  on public.research_workflows
  for delete
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = owner_id);
