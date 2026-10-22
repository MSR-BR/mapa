\set ON_ERROR_STOP on
-- Synthetic users; no production data or credentials.
insert into auth.users (id,email,email_confirmed_at) values
 ('55555555-5555-4555-8555-555555555555','unconfirmed@example.invalid',null),
 ('66666666-6666-4666-8666-666666666666','password@example.invalid',now()),
 ('77777777-7777-4777-8777-777777777777','mismatch@example.invalid',now());
insert into auth.identities (user_id,provider,identity_data) values
 ('55555555-5555-4555-8555-555555555555','google','{"email":"unconfirmed@example.invalid"}'),
 ('66666666-6666-4666-8666-666666666666','email','{"email":"password@example.invalid"}'),
 ('77777777-7777-4777-8777-777777777777','google','{"email":"different@example.invalid"}');
insert into public.user_profiles(user_id,active_role) values
 ('55555555-5555-4555-8555-555555555555','advisor'),
 ('66666666-6666-4666-8666-666666666666','advisor'),
 ('77777777-7777-4777-8777-777777777777','advisor');
insert into public.projects(id,owner_id,title,workflow_version,advisor_email) values
 ('55555555-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','Unconfirmed target',2,'unconfirmed@example.invalid'),
 ('66666666-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','Password target',2,'password@example.invalid'),
 ('77777777-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','Mismatched identity',2,'mismatch@example.invalid'),
 ('12500000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','New student map',2,null);
-- Existing returned review: C111 freezes pending submissions, but a returned
-- review was still mutable by its owner before C125.
insert into public.projects(id,owner_id,title,workflow_version,advisor_id,advisor_email)
values ('12500000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','Returned review',2,'22222222-2222-4222-8222-222222222222','advisor@example.invalid');
insert into public.research_workflows(project_id,owner_id,state,stable_state,content)
values ('12500000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','choosing_problem','choosing_problem',
'{"activeStep":"problem_statement","advisorReviews":[{"id":"returned-1","status":"changes_requested","advisorId":"22222222-2222-4222-8222-222222222222","advisorComments":"Revise the question","reviewedAt":"2026-10-20T00:00:00Z","targetState":"validating_general_objective","targetStableState":"validating_general_objective","targetActiveStep":"general_objective"}]}');
insert into auth.users(id,email) values ('88888888-8888-4888-8888-888888888888','unconfirmed-student@example.invalid');
insert into auth.identities(user_id,provider,identity_data) values ('88888888-8888-4888-8888-888888888888','google','{"email":"unconfirmed-student@example.invalid"}');
insert into public.user_profiles(user_id,active_role) values ('88888888-8888-4888-8888-888888888888','student');
insert into public.projects(id,owner_id,title,workflow_version) values ('88888888-0000-4000-8000-000000000001','88888888-8888-4888-8888-888888888888','Unconfirmed requester',2);

-- Existing student map: an approved earlier step can be resubmitted without
-- losing the later stable position (C111 contract used by prepareWorkflowEdit).
insert into public.projects(id,owner_id,title,workflow_version,advisor_id,advisor_email)
values ('12500000-0000-4000-8000-000000000003','11111111-1111-4111-8111-111111111111','Revisit earlier step',2,'22222222-2222-4222-8222-222222222222','advisor@example.invalid');
insert into public.research_workflows(project_id,owner_id,state,stable_state,content)
values ('12500000-0000-4000-8000-000000000003','11111111-1111-4111-8111-111111111111','validating_methodology','validating_methodology',
'{"activeStep":"methodology_matrix","advisorReviews":[],"elements":[{"id":"12500000-0000-4000-8000-000000000004","type":"problem_statement","status":"validated","approvedContent":"Original problem preserved"}]}');
