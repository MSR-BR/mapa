create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  active_role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_profiles_active_role_check
    check (active_role in ('student', 'advisor')),
  constraint user_profiles_timestamps_order
    check (updated_at >= created_at)
);

comment on table public.user_profiles is
  'Preferência de uso ativa da conta: estudante ou orientador.';
comment on column public.user_profiles.active_role is
  'Modo ativo da conta. Controla quais opções aparecem na interface.';

alter table public.user_profiles enable row level security;

revoke all on table public.user_profiles from anon;
grant select, insert, update on table public.user_profiles to authenticated;

drop policy if exists "user_profiles_select_own" on public.user_profiles;
create policy "user_profiles_select_own"
  on public.user_profiles
  for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "user_profiles_insert_own" on public.user_profiles;
create policy "user_profiles_insert_own"
  on public.user_profiles
  for insert
  to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "user_profiles_update_own" on public.user_profiles;
create policy "user_profiles_update_own"
  on public.user_profiles
  for update
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create or replace function public.set_project_advisor(project_id_input uuid, advisor_email_input text)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  normalized_email text := lower(nullif(btrim(advisor_email_input), ''));
  resolved_advisor_id uuid := null;
  updated_count integer := 0;
begin
  if auth.uid() is null then
    return false;
  end if;

  if normalized_email is not null then
    select u.id
    into resolved_advisor_id
    from auth.users u
    where lower(u.email) = normalized_email
    order by u.created_at asc
    limit 1;
  end if;

  update public.projects
  set advisor_email = normalized_email,
      advisor_id = resolved_advisor_id,
      updated_at = now()
  where id = project_id_input
    and owner_id = auth.uid()
    and deleted_at is null;

  get diagnostics updated_count = row_count;
  if updated_count = 0 then
    raise exception 'project_not_found_or_not_owned';
  end if;

  return resolved_advisor_id is not null;
end;
$$;

comment on function public.set_project_advisor(uuid, text) is
  'Atualiza o orientador de um projeto do usuário autenticado, vinculando a conta se o e-mail já existir.';

revoke all on function public.set_project_advisor(uuid, text) from public;
grant execute on function public.set_project_advisor(uuid, text) to authenticated;

create or replace function public.claim_pending_advisor_projects()
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_email text := lower(nullif(btrim(auth.jwt() ->> 'email'), ''));
  updated_count integer := 0;
begin
  if auth.uid() is null or current_email is null then
    return 0;
  end if;

  update public.projects
  set advisor_id = auth.uid(),
      updated_at = now()
  where deleted_at is null
    and advisor_email is not null
    and lower(advisor_email) = current_email
    and advisor_id is distinct from auth.uid();

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

comment on function public.claim_pending_advisor_projects() is
  'Vincula projetos pendentes ao usuário autenticado quando o e-mail do orientador coincide com a conta.';

revoke all on function public.claim_pending_advisor_projects() from public;
grant execute on function public.claim_pending_advisor_projects() to authenticated;

drop policy if exists "projects_select_advised" on public.projects;

create policy "projects_select_advised"
  on public.projects
  for select
  to authenticated
  using (
    (select auth.uid()) is not null
    and deleted_at is null
    and (
      advisor_id = (select auth.uid())
      or (
        advisor_email is not null
        and lower(advisor_email) = lower((select auth.jwt() ->> 'email'))
      )
    )
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
        and (
          p.advisor_id = (select auth.uid())
          or (
            p.advisor_email is not null
            and lower(p.advisor_email) = lower((select auth.jwt() ->> 'email'))
          )
        )
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
        and (
          p.advisor_id = (select auth.uid())
          or (
            p.advisor_email is not null
            and lower(p.advisor_email) = lower((select auth.jwt() ->> 'email'))
          )
        )
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
        and (
          p.advisor_id = (select auth.uid())
          or (
            p.advisor_email is not null
            and lower(p.advisor_email) = lower((select auth.jwt() ->> 'email'))
          )
        )
    )
  );
