-- C165: academic details are private to the student; advisors see only the
-- student's display name through projects they are already allowed to read.
create table public.student_academic_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 120),
  university text not null check (char_length(btrim(university)) between 2 and 160),
  department text not null check (char_length(btrim(department)) between 2 and 160),
  course_name text not null check (char_length(btrim(course_name)) between 2 and 160),
  study_levels text[] not null check (
    cardinality(study_levels) between 1 and 5
    and array_position(study_levels, null) is null
    and study_levels <@ array['tcc', 'academic_masters', 'professional_masters', 'doctorate', 'other']::text[]
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.student_academic_profiles enable row level security;
revoke all on table public.student_academic_profiles from public, anon, authenticated, service_role;
grant select, insert, update on table public.student_academic_profiles to authenticated;
create policy student_academic_profiles_select_own on public.student_academic_profiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy student_academic_profiles_insert_own on public.student_academic_profiles
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy student_academic_profiles_update_own on public.student_academic_profiles
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

alter table public.projects add column student_display_name text
  check (student_display_name is null or char_length(btrim(student_display_name)) between 2 and 120);

-- Existing maps receive the OAuth name when present. This is presentation
-- data only and is never used to authorize access.
update public.projects p
set student_display_name = left(btrim(coalesce(
  nullif(u.raw_user_meta_data ->> 'full_name', ''),
  nullif(u.raw_user_meta_data ->> 'name', ''), ''
)), 120)
from auth.users u
where p.owner_id = u.id
  and p.authoring_role = 'student'
  and char_length(btrim(coalesce(
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    nullif(u.raw_user_meta_data ->> 'name', ''), ''
  ))) >= 2;

create or replace function private.sync_student_academic_name()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.projects
  set student_display_name = new.display_name
  where owner_id = new.user_id and authoring_role = 'student';
  return new;
end;
$$;
revoke all on function private.sync_student_academic_name() from public, anon, authenticated, service_role;
create trigger sync_student_academic_name_after_write
  after insert or update of display_name on public.student_academic_profiles
  for each row execute function private.sync_student_academic_name();

create or replace function private.copy_student_academic_name()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.authoring_role = 'student' then
    select display_name into new.student_display_name
    from public.student_academic_profiles where user_id = new.owner_id;
  end if;
  return new;
end;
$$;
revoke all on function private.copy_student_academic_name() from public, anon, authenticated, service_role;
create trigger copy_student_academic_name_before_insert
  before insert on public.projects
  for each row execute function private.copy_student_academic_name();
