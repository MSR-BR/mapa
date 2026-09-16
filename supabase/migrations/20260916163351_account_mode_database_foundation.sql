begin;

-- Change 083: additive database foundation for switchable account modes.
--
-- This migration deliberately does not grant the role-switch RPC to application
-- roles. The UI and the mode-aware authorization layer are introduced only by
-- later changes. All preflight failures abort the transaction before data is
-- reclassified.

do $$
declare
  invalid_profiles bigint;
  projects_without_profiles bigint;
  student_self_advised_projects bigint;
  advisor_self_advised_email_mismatches bigint;
begin
  if to_regclass('public.user_profiles') is null
    or to_regclass('public.projects') is null
  then
    raise exception 'c083_required_tables_missing';
  end if;

  select count(*)
  into invalid_profiles
  from public.user_profiles
  where active_role not in ('student', 'advisor');

  select count(*)
  into projects_without_profiles
  from public.projects p
  left join public.user_profiles up on up.user_id = p.owner_id
  where up.user_id is null;

  select count(*)
  into student_self_advised_projects
  from public.projects p
  join public.user_profiles up on up.user_id = p.owner_id
  where up.active_role = 'student'
    and p.advisor_id = p.owner_id;

  select count(*)
  into advisor_self_advised_email_mismatches
  from public.projects p
  join public.user_profiles up on up.user_id = p.owner_id
  join auth.users owner_user on owner_user.id = p.owner_id
  where up.active_role = 'advisor'
    and p.advisor_id = p.owner_id
    and p.advisor_email is not null
    and (
      owner_user.email is null
      or lower(trim(p.advisor_email)) <> lower(trim(owner_user.email))
    );

  if invalid_profiles > 0 then
    raise exception 'c083_invalid_profile_roles:%', invalid_profiles;
  end if;
  if projects_without_profiles > 0 then
    raise exception 'c083_projects_without_profiles:%', projects_without_profiles;
  end if;
  if student_self_advised_projects > 0 then
    raise exception 'c083_student_self_advised_projects:%', student_self_advised_projects;
  end if;
  if advisor_self_advised_email_mismatches > 0 then
    raise exception 'c083_advisor_self_advised_email_mismatches:%', advisor_self_advised_email_mismatches;
  end if;
end
$$;

alter table public.user_profiles
  add column role_version bigint,
  add column role_changed_at timestamptz;

update public.user_profiles
set role_version = 1,
    role_changed_at = coalesce(updated_at, created_at, now());

alter table public.user_profiles
  alter column role_version set default 1,
  alter column role_version set not null,
  alter column role_changed_at set default now(),
  alter column role_changed_at set not null,
  add constraint user_profiles_role_version_positive
    check (role_version >= 1);

comment on column public.user_profiles.active_role is
  'Modo ativo da conta. Pode mudar apenas pela RPC versionada quando ela for liberada.';
comment on column public.user_profiles.role_version is
  'Versão monotônica do modo ativo usada para controle de concorrência.';
comment on column public.user_profiles.role_changed_at is
  'Instante da criação do perfil ou da última troca efetiva de modo.';

create table public.user_profile_role_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  previous_role text,
  active_role text not null,
  role_version bigint not null,
  event_type text not null,
  idempotency_key uuid,
  changed_at timestamptz not null default now(),
  constraint user_profile_role_events_previous_role_check
    check (previous_role is null or previous_role in ('student', 'advisor')),
  constraint user_profile_role_events_active_role_check
    check (active_role in ('student', 'advisor')),
  constraint user_profile_role_events_role_version_positive
    check (role_version >= 1),
  constraint user_profile_role_events_type_check
    check (event_type in ('baseline', 'profile_created', 'role_switched', 'role_switch_noop'))
);

comment on table public.user_profile_role_events is
  'Trilha append-only e sem e-mail ou conteúdo acadêmico para mudanças do modo ativo.';
comment on column public.user_profile_role_events.idempotency_key is
  'Identificador opaco de uma solicitação de troca; nulo para eventos automáticos e baseline.';

create index user_profile_role_events_user_changed_idx
  on public.user_profile_role_events (user_id, changed_at desc);

create index user_profile_role_events_actor_idx
  on public.user_profile_role_events (actor_id)
  where actor_id is not null;

create unique index user_profile_role_events_idempotency_idx
  on public.user_profile_role_events (user_id, idempotency_key)
  where idempotency_key is not null;

alter table public.user_profile_role_events enable row level security;

revoke all on table public.user_profile_role_events
  from public, anon, authenticated;
grant select on table public.user_profile_role_events to service_role;

create or replace function public.enforce_user_profile_role_version()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.role_version := 1;
    new.role_changed_at := coalesce(new.created_at, statement_timestamp());
    return new;
  end if;

  if new.active_role is distinct from old.active_role then
    new.role_version := old.role_version + 1;
    new.role_changed_at := statement_timestamp();
    new.updated_at := greatest(new.updated_at, new.role_changed_at);
  else
    new.role_version := old.role_version;
    new.role_changed_at := old.role_changed_at;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_user_profile_role_version()
  from public, anon, authenticated;

create trigger enforce_user_profile_role_version_trigger
before insert or update on public.user_profiles
for each row
execute function public.enforce_user_profile_role_version();

create or replace function public.audit_user_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_key_text text := nullif(
    current_setting('mapa.role_change_idempotency_key', true),
    ''
  );
  request_key uuid := null;
begin
  if request_key_text is not null then
    request_key := request_key_text::uuid;
  end if;

  if tg_op = 'INSERT' then
    insert into public.user_profile_role_events (
      user_id,
      actor_id,
      previous_role,
      active_role,
      role_version,
      event_type,
      idempotency_key,
      changed_at
    ) values (
      new.user_id,
      auth.uid(),
      null,
      new.active_role,
      new.role_version,
      'profile_created',
      request_key,
      new.role_changed_at
    );
  elsif new.active_role is distinct from old.active_role then
    insert into public.user_profile_role_events (
      user_id,
      actor_id,
      previous_role,
      active_role,
      role_version,
      event_type,
      idempotency_key,
      changed_at
    ) values (
      new.user_id,
      auth.uid(),
      old.active_role,
      new.active_role,
      new.role_version,
      'role_switched',
      request_key,
      new.role_changed_at
    );
  end if;

  return new;
end;
$$;

revoke all on function public.audit_user_profile_role_change()
  from public, anon, authenticated;

create trigger audit_user_profile_role_change_trigger
after insert or update on public.user_profiles
for each row
execute function public.audit_user_profile_role_change();

insert into public.user_profile_role_events (
  user_id,
  actor_id,
  previous_role,
  active_role,
  role_version,
  event_type,
  idempotency_key,
  changed_at
)
select
  user_id,
  null,
  null,
  active_role,
  role_version,
  'baseline',
  null,
  role_changed_at
from public.user_profiles;

alter table public.projects
  add column authoring_role text;

update public.projects p
set authoring_role = case
  when up.active_role = 'advisor'
    and (
      (p.advisor_id is null and p.advisor_email is null)
      or p.advisor_id = p.owner_id
    )
  then 'advisor'
  else 'student'
end
from public.user_profiles up
where up.user_id = p.owner_id;

-- Before switchable modes existed, advisors sometimes selected themselves to
-- satisfy the student supervision fields. That is an explicit signal of an
-- advisor-authored project, so the redundant link is removed. A distinct
-- supervisor remains intact and classifies the historical project as authored
-- in student mode, even when the owner's current account mode is advisor.
update public.projects
set advisor_id = null,
    advisor_email = null
where authoring_role = 'advisor'
  and (advisor_id is not null or advisor_email is not null);

do $$
begin
  if exists (
    select 1
    from public.projects
    where authoring_role is null
  ) then
    raise exception 'c083_project_authoring_backfill_incomplete';
  end if;
end
$$;

alter table public.projects
  alter column authoring_role set default 'student',
  alter column authoring_role set not null,
  add constraint projects_authoring_role_check
    check (authoring_role in ('student', 'advisor')),
  add constraint projects_advisor_authorship_autonomous
    check (
      authoring_role <> 'advisor'
      or (advisor_id is null and advisor_email is null)
    );

comment on column public.projects.authoring_role is
  'Modo imutável no qual o projeto foi criado; derivado do perfil do proprietário no INSERT.';

create or replace function public.enforce_project_authoring_role()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  resolved_role text;
begin
  if tg_op = 'INSERT' then
    select up.active_role
    into resolved_role
    from public.user_profiles up
    where up.user_id = new.owner_id;

    if resolved_role is null then
      raise exception 'project_owner_profile_required';
    end if;

    new.authoring_role := resolved_role;
  elsif new.authoring_role is distinct from old.authoring_role then
    raise exception 'project_authoring_role_is_immutable';
  end if;

  if new.authoring_role = 'advisor'
    and (new.advisor_id is not null or new.advisor_email is not null)
  then
    raise exception 'advisor_authored_project_cannot_have_supervisor';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_project_authoring_role()
  from public, anon, authenticated;

create trigger enforce_project_authoring_role_trigger
before insert or update of authoring_role, advisor_id, advisor_email
on public.projects
for each row
execute function public.enforce_project_authoring_role();

create or replace function public.switch_active_role(
  next_role text,
  expected_role_version bigint,
  request_id uuid
)
returns table (
  active_role text,
  role_version bigint,
  role_changed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_profile public.user_profiles%rowtype;
  prior_request public.user_profile_role_events%rowtype;
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;
  if next_role not in ('student', 'advisor') then
    raise exception 'invalid_active_role';
  end if;
  if expected_role_version is null or expected_role_version < 1 then
    raise exception 'invalid_expected_role_version';
  end if;
  if request_id is null then
    raise exception 'idempotency_key_required';
  end if;

  select up.*
  into current_profile
  from public.user_profiles up
  where up.user_id = current_user_id
  for update;

  if not found then
    raise exception 'user_profile_not_found';
  end if;

  select event.*
  into prior_request
  from public.user_profile_role_events event
  where event.user_id = current_user_id
    and event.idempotency_key = request_id;

  if found then
    if prior_request.active_role is distinct from next_role then
      raise exception 'idempotency_key_conflict';
    end if;

    return query
    select
      prior_request.active_role,
      prior_request.role_version,
      prior_request.changed_at;
    return;
  end if;

  if current_profile.role_version <> expected_role_version then
    raise exception 'role_version_conflict';
  end if;

  if current_profile.active_role = next_role then
    insert into public.user_profile_role_events (
      user_id,
      actor_id,
      previous_role,
      active_role,
      role_version,
      event_type,
      idempotency_key,
      changed_at
    ) values (
      current_user_id,
      current_user_id,
      current_profile.active_role,
      current_profile.active_role,
      current_profile.role_version,
      'role_switch_noop',
      request_id,
      statement_timestamp()
    )
    returning * into prior_request;

    return query
    select
      current_profile.active_role,
      current_profile.role_version,
      current_profile.role_changed_at;
    return;
  end if;

  perform pg_catalog.set_config(
    'mapa.role_change_idempotency_key',
    request_id::text,
    true
  );

  update public.user_profiles up
  set active_role = next_role
  where up.user_id = current_user_id
    and up.role_version = expected_role_version
  returning up.* into current_profile;

  perform pg_catalog.set_config('mapa.role_change_idempotency_key', '', true);

  if not found then
    raise exception 'role_version_conflict';
  end if;

  return query
  select
    current_profile.active_role,
    current_profile.role_version,
    current_profile.role_changed_at;
end;
$$;

comment on function public.switch_active_role(text, bigint, uuid) is
  'Troca atômica e idempotente do modo ativo. EXECUTE permanece revogado até a autorização da C87.';

revoke all on function public.switch_active_role(text, bigint, uuid)
  from public, anon, authenticated, service_role;

-- Reassert the lock introduced by C064. Later changes must use the RPC rather
-- than reopening UPDATE on the profile table.
revoke update on table public.user_profiles from authenticated;

commit;
