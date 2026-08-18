create table if not exists public.legal_consents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  terms_version text not null,
  accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint legal_consents_timestamps_order check (updated_at >= created_at)
);

alter table public.legal_consents enable row level security;
revoke all on table public.legal_consents from anon;
grant select, insert, update on table public.legal_consents to authenticated;

drop policy if exists "legal_consents_select_own" on public.legal_consents;
create policy "legal_consents_select_own" on public.legal_consents
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "legal_consents_insert_own" on public.legal_consents;
create policy "legal_consents_insert_own" on public.legal_consents
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "legal_consents_update_own" on public.legal_consents;
create policy "legal_consents_update_own" on public.legal_consents
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
