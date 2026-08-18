alter table public.legal_consents
  add column if not exists profile_role text not null default 'student';

alter table public.legal_consents
  drop constraint if exists legal_consents_pkey;

alter table public.legal_consents
  add constraint legal_consents_profile_role_check check (profile_role in ('student', 'advisor'));

alter table public.legal_consents
  add constraint legal_consents_pkey primary key (user_id, profile_role);
