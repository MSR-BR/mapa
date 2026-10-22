begin;

-- C125 / SEC-01. Trust Auth-managed users and identities, not user_metadata.
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
  where u.id = current_user_id and u.email_confirmed_at is not null
    and exists (
      select 1 from auth.identities i
      where i.user_id = u.id and i.provider = 'google'
        and lower(nullif(btrim(i.identity_data ->> 'email'), '')) = lower(nullif(btrim(u.email), ''))
    );

  if current_email is null then
    raise exception 'verified_google_identity_required' using errcode = '42501';
  end if;

  if normalized_email is not null and normalized_email = current_email then
    raise exception 'self_advising_not_allowed';
  end if;

  if normalized_email is not null then
    select u.id into resolved_advisor_id
    from auth.users u
    where lower(u.email) = normalized_email and u.email_confirmed_at is not null
    and exists (
      select 1 from auth.identities i
      where i.user_id = u.id and i.provider = 'google'
        and lower(nullif(btrim(i.identity_data ->> 'email'), '')) = lower(nullif(btrim(u.email), ''))
    )
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
  where u.id = current_user_id and u.email_confirmed_at is not null
    and exists (
      select 1 from auth.identities i
      where i.user_id = u.id and i.provider = 'google'
        and lower(nullif(btrim(i.identity_data ->> 'email'), '')) = lower(nullif(btrim(u.email), ''))
    );

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


-- Direct project INSERT must not bypass the same identity check in the RPC.
create or replace function public.guard_project_advisor_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.advisor_id is not null and not exists (
    select 1 from auth.users u
    where u.id = new.advisor_id and u.id <> new.owner_id
      and lower(nullif(btrim(u.email), '')) = lower(nullif(btrim(new.advisor_email), ''))
      and u.email_confirmed_at is not null
    and exists (
      select 1 from auth.identities i
      where i.user_id = u.id and i.provider = 'google'
        and lower(nullif(btrim(i.identity_data ->> 'email'), '')) = lower(nullif(btrim(u.email), ''))
    )
  ) then
    raise exception 'verified_google_advisor_required' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_project_advisor_identity() from public, anon, authenticated, service_role;
create trigger guard_project_advisor_identity_trigger
before insert or update of advisor_id, advisor_email on public.projects
for each row execute function public.guard_project_advisor_identity();
alter table public.projects enable row level security;
-- Preserve owner/mode/linked-advisor RLS and the column-limited UPDATE contract.
revoke all on table public.projects from public, anon, authenticated, service_role;
grant select, insert, delete on table public.projects to authenticated;
grant update (
  title, theme, problem_statement, keywords, knowledge_area, academic_level,
  status, updated_at, deleted_at, workflow_version
) on table public.projects to authenticated;
commit;
