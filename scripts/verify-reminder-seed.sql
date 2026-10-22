\set ON_ERROR_STOP on
-- Synthetic records only. This script is used exclusively in a disposable DB.
insert into public.projects(id,owner_id,title,advisor_id,advisor_email,workflow_version)
select ('12700000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'11111111-1111-4111-8111-111111111111','Reminder fixture','22222222-2222-4222-8222-222222222222','advisor@example.invalid',2 from generate_series(1,27) n;
insert into public.research_workflows(project_id,owner_id,state,stable_state,content)
select id,owner_id,'choosing_problem','choosing_problem',
'{"activeStep":"problem_statement","advisorReviews":[{"id":"current-review","status":"pending","advisorEmail":"spoof@example.invalid","studentEmail":"spoof@example.invalid","step":"problem_statement","targetState":"validating_general_objective","targetStableState":"validating_general_objective","targetActiveStep":"general_objective"}]}'
from public.projects where id::text like '12700000%';
