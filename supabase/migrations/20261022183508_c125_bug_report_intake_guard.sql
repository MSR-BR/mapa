begin;
-- C125 / SEC-05. Match the route's existing 5 MiB PNG/JPEG/WebP contract.
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp'],
    public = false
where id = 'bug-report-attachments';

do $$ begin
  if not exists (select 1 from storage.buckets where id = 'bug-report-attachments') then
    raise exception 'bug_report_bucket_missing';
  end if;
end $$;

alter table public.bug_reports enable row level security;
revoke all on table public.bug_reports from public, anon, authenticated, service_role;
grant insert (
  id, reporter_id, reporter_email, subject, message, stage, page_url,
  browser, user_agent, project_id, attachment_path, attachment_name,
  attachment_type, attachment_size
) on table public.bug_reports to anon, authenticated;
grant select, update on table public.bug_reports to authenticated;
-- Defense in depth at INSERT only; admins may still triage via UPDATE.
drop policy if exists "bug_reports_insert_anonymous" on public.bug_reports;
create policy "bug_reports_insert_anonymous" on public.bug_reports
for insert to anon with check (
  reporter_id is null and status = 'new' and priority = 'normal'
  and admin_notes is null and resolved_at is null
);
drop policy if exists "bug_reports_insert_authenticated" on public.bug_reports;
create policy "bug_reports_insert_authenticated" on public.bug_reports
for insert to authenticated with check (
  (select auth.uid()) is not null and reporter_id = (select auth.uid())
  and status = 'new' and priority = 'normal'
  and admin_notes is null and resolved_at is null
);
-- Existing reporter/admin SELECT, admin UPDATE and Storage path RLS remain.
commit;
