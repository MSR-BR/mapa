begin;

-- INSERT ... RETURNING is evaluated against the SELECT policy before a helper
-- subquery can reliably see the row created by the same command. Keep the
-- projects-table ownership check on the row itself; child tables still use the
-- parent lookup helper.
drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own" on public.projects
  for select to authenticated
  using (
    (select auth.uid()) is not null
    and owner_id = (select auth.uid())
    and authoring_role = (select private.current_active_role())
  );

commit;
