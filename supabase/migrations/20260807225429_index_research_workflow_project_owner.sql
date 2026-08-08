-- Migration version recorded remotely: 20260807225429.
create index research_workflows_project_owner_idx
  on public.research_workflows (project_id, owner_id);
