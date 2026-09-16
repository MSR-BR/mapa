create schema auth;

create table auth.users (
  id uuid primary key,
  email text,
  created_at timestamptz not null default now()
);

create or replace function auth.uid()
returns uuid
language sql
stable
set search_path = ''
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'create role anon nologin';
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'create role authenticated nologin';
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'create role service_role nologin';
  end if;
end
$$;

create table public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  active_role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_profiles_active_role_check
    check (active_role in ('student', 'advisor')),
  constraint user_profiles_timestamps_order
    check (updated_at >= created_at)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  advisor_email text,
  advisor_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.user_profiles enable row level security;
alter table public.projects enable row level security;

grant select, insert on table public.user_profiles to authenticated;
grant select, insert, update, delete on table public.projects to authenticated;

create policy user_profiles_select_own
  on public.user_profiles
  for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy user_profiles_insert_own
  on public.user_profiles
  for insert
  to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy projects_select_own
  on public.projects
  for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

create policy projects_insert_own
  on public.projects
  for insert
  to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

create policy projects_update_own
  on public.projects
  for update
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = owner_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

create policy projects_delete_own
  on public.projects
  for delete
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'student@example.invalid'),
  ('22222222-2222-4222-8222-222222222222', 'advisor@example.invalid'),
  ('33333333-3333-4333-8333-333333333333', 'new-profile@example.invalid'),
  ('44444444-4444-4444-8444-444444444444', 'historical-advisor@example.invalid');

insert into public.user_profiles (user_id, active_role) values
  ('11111111-1111-4111-8111-111111111111', 'student'),
  ('22222222-2222-4222-8222-222222222222', 'advisor');

insert into public.projects (id, owner_id, title, advisor_id, advisor_email) values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    'Projeto existente do aluno',
    '22222222-2222-4222-8222-222222222222',
    'advisor@example.invalid'
  );

insert into public.projects (id, owner_id, title) values
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '22222222-2222-4222-8222-222222222222',
    'Projeto autônomo do orientador'
  );

insert into public.projects (id, owner_id, title, advisor_id, advisor_email) values
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    '22222222-2222-4222-8222-222222222222',
    'Projeto legado auto-orientado',
    '22222222-2222-4222-8222-222222222222',
    'advisor@example.invalid'
  ),
  (
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    '22222222-2222-4222-8222-222222222222',
    'Projeto histórico criado como aluno',
    '44444444-4444-4444-8444-444444444444',
    'historical-advisor@example.invalid'
  );
