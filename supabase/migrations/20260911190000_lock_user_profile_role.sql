-- Change 064: the account role is selected once and cannot be switched later.
-- Student and advisor experiences are intentionally separate throughout a session
-- and across future sign-ins.

revoke update on table public.user_profiles from authenticated;

drop policy if exists "user_profiles_update_own" on public.user_profiles;

comment on column public.user_profiles.active_role is
  'Immutable account role selected on first access. Controls the student or review workspace.';
