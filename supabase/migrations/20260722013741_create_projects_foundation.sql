-- Migration version recorded remotely: 20260722013741.
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  theme text,
  problem_statement text,
  keywords text[] not null default '{}'::text[],
  knowledge_area text,
  academic_level text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint projects_title_length check (
    char_length(btrim(title)) between 1 and 160
  ),
  constraint projects_theme_length check (
    theme is null or char_length(theme) <= 500
  ),
  constraint projects_problem_statement_length check (
    problem_statement is null or char_length(problem_statement) <= 5000
  ),
  constraint projects_keywords_limit check (
    cardinality(keywords) <= 12 and array_position(keywords, null) is null
  ),
  constraint projects_knowledge_area_length check (
    knowledge_area is null or char_length(knowledge_area) <= 120
  ),
  constraint projects_academic_level_check check (
    academic_level is null or academic_level in (
      'undergraduate',
      'specialization',
      'masters',
      'doctorate',
      'other'
    )
  ),
  constraint projects_status_check check (
    status in ('draft', 'ready', 'generating', 'generated', 'failed', 'archived')
  ),
  constraint projects_timestamps_order check (
    updated_at >= created_at and (deleted_at is null or deleted_at >= created_at)
  )
);

comment on table public.projects is
  'Projetos de pesquisa pertencentes a um único usuário autenticado.';
comment on column public.projects.deleted_at is
  'Data de exclusão lógica; nulo enquanto o projeto estiver ativo.';

create index projects_owner_updated_at_idx
  on public.projects (owner_id, updated_at desc);

alter table public.projects enable row level security;

revoke all on table public.projects from anon;
grant select, insert, update, delete on table public.projects to authenticated;

create policy "projects_select_own"
  on public.projects
  for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

create policy "projects_insert_own"
  on public.projects
  for insert
  to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

create policy "projects_update_own"
  on public.projects
  for update
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = owner_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

create policy "projects_delete_own"
  on public.projects
  for delete
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = owner_id);
