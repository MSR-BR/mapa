-- Change 041: private bug reports with RLS and private attachments.
create table public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users (id) on delete set null,
  reporter_email text not null,
  subject text not null,
  message text not null,
  stage text,
  page_url text,
  browser text,
  user_agent text,
  project_id uuid references public.projects (id) on delete set null,
  attachment_path text,
  attachment_name text,
  attachment_type text,
  attachment_size integer,
  status text not null default 'new',
  priority text not null default 'normal',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint bug_reports_email_length check (char_length(btrim(reporter_email)) between 3 and 320),
  constraint bug_reports_subject_length check (char_length(btrim(subject)) between 3 and 180),
  constraint bug_reports_message_length check (char_length(btrim(message)) between 10 and 4000),
  constraint bug_reports_stage_length check (stage is null or char_length(stage) <= 160),
  constraint bug_reports_page_url_length check (page_url is null or char_length(page_url) <= 2048),
  constraint bug_reports_browser_length check (browser is null or char_length(browser) <= 500),
  constraint bug_reports_user_agent_length check (user_agent is null or char_length(user_agent) <= 1000),
  constraint bug_reports_attachment_name_length check (attachment_name is null or char_length(attachment_name) <= 240),
  constraint bug_reports_attachment_type_check check (attachment_type is null or attachment_type in ('image/png', 'image/jpeg', 'image/webp')),
  constraint bug_reports_attachment_size_check check (attachment_size is null or attachment_size between 1 and 5242880),
  constraint bug_reports_status_check check (status in ('new', 'in_review', 'fixed', 'closed')),
  constraint bug_reports_priority_check check (priority in ('low', 'normal', 'high', 'urgent')),
  constraint bug_reports_resolved_order check (resolved_at is null or resolved_at >= created_at)
);

comment on table public.bug_reports is
  'Relatos de problemas enviados pelos usuários, visíveis ao remetente e à equipe de triagem autorizada.';

create index bug_reports_status_created_at_idx
  on public.bug_reports (status, created_at desc);
create index bug_reports_reporter_created_at_idx
  on public.bug_reports (reporter_id, created_at desc);

create or replace function public.is_bug_report_admin()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) in (
    'marioreis@id.uff.br',
    'sfranca@id.uff.br'
  );
$$;

revoke all on function public.is_bug_report_admin() from public, anon;
grant execute on function public.is_bug_report_admin() to authenticated;

alter table public.bug_reports enable row level security;

revoke all on table public.bug_reports from anon, authenticated;
grant insert on table public.bug_reports to anon, authenticated;
grant select, update on table public.bug_reports to authenticated;

create policy "bug_reports_insert_anonymous"
  on public.bug_reports
  for insert
  to anon
  with check (reporter_id is null);

create policy "bug_reports_insert_authenticated"
  on public.bug_reports
  for insert
  to authenticated
  with check ((select auth.uid()) is not null and reporter_id = (select auth.uid()));

create policy "bug_reports_select_reporter_or_admin"
  on public.bug_reports
  for select
  to authenticated
  using (
    (select auth.uid()) = reporter_id
    or (select public.is_bug_report_admin())
  );

create policy "bug_reports_update_admin"
  on public.bug_reports
  for update
  to authenticated
  using ((select public.is_bug_report_admin()))
  with check ((select public.is_bug_report_admin()));

insert into storage.buckets (id, name, public)
values ('bug-report-attachments', 'bug-report-attachments', false)
on conflict (id) do nothing;

create policy "bug_report_attachments_insert_anonymous"
  on storage.objects
  for insert
  to anon
  with check (
    bucket_id = 'bug-report-attachments'
    and split_part(name, '/', 1) = 'anonymous'
  );

create policy "bug_report_attachments_insert_authenticated"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'bug-report-attachments'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

create policy "bug_report_attachments_select_owner_or_admin"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'bug-report-attachments'
    and (
      split_part(name, '/', 1) = (select auth.uid())::text
      or (select public.is_bug_report_admin())
    )
  );
