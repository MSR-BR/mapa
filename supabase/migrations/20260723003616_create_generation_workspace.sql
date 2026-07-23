create table public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  idempotency_key uuid not null,
  status text not null default 'queued',
  attempt_count smallint not null default 1,
  error_code text,
  report_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint generation_jobs_owner_idempotency_unique unique (owner_id, idempotency_key),
  constraint generation_jobs_status_check check (status in ('queued', 'researching', 'generating', 'completed', 'failed')),
  constraint generation_jobs_attempt_count_check check (attempt_count between 1 and 3),
  constraint generation_jobs_error_code_length check (error_code is null or char_length(error_code) <= 80)
);

create table public.research_structures (
  project_id uuid primary key references public.projects (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  schema_version text not null,
  prompt_version text not null,
  model text not null,
  content jsonb not null,
  references_data jsonb not null default '[]'::jsonb,
  warnings text[] not null default '{}'::text[],
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint research_structures_revision_check check (revision > 0),
  constraint research_structures_references_array_check check (jsonb_typeof(references_data) = 'array'),
  constraint research_structures_content_object_check check (jsonb_typeof(content) = 'object')
);

create index generation_jobs_project_created_idx on public.generation_jobs (project_id, created_at desc);
create index generation_jobs_owner_created_idx on public.generation_jobs (owner_id, created_at desc);
create index research_structures_owner_idx on public.research_structures (owner_id);

alter table public.generation_jobs enable row level security;
alter table public.research_structures enable row level security;

revoke all on table public.generation_jobs, public.research_structures from anon;
grant select, insert, update, delete on table public.generation_jobs, public.research_structures to authenticated;

create policy "generation_jobs_select_own" on public.generation_jobs for select to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = owner_id);
create policy "generation_jobs_insert_own" on public.generation_jobs for insert to authenticated with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);
create policy "generation_jobs_update_own" on public.generation_jobs for update to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = owner_id) with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);
create policy "generation_jobs_delete_own" on public.generation_jobs for delete to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

create policy "research_structures_select_own" on public.research_structures for select to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = owner_id);
create policy "research_structures_insert_own" on public.research_structures for insert to authenticated with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);
create policy "research_structures_update_own" on public.research_structures for update to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = owner_id) with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);
create policy "research_structures_delete_own" on public.research_structures for delete to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = owner_id);
