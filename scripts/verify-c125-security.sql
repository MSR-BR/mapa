\set ON_ERROR_STOP on
set test.hardened = :'hardened';
-- A passing baseline attempt is rolled back deliberately, so attacks never
-- contaminate subsequent tests. Hardened attempts must fail for the exact cause.
create or replace function pg_temp.probe(label text, query text, expected_error text)
returns text language plpgsql security invoker as $$
declare caught text;
begin
  begin
    execute query;
    raise exception 'probe_success_rollback';
  exception when others then caught := sqlerrm;
  end;
  if current_setting('test.hardened')::boolean then
    if caught !~ expected_error then raise exception 'FAIL %: %', label, caught; end if;
    return 'blocked: ' || label;
  end if;
  if caught <> 'probe_success_rollback' then raise exception 'baseline FAIL %: %', label, caught; end if;
  return 'reproduced: ' || label;
end $$;
-- Functions that return false/zero instead of throwing also roll back the claim.
create or replace function pg_temp.claim_probe(expected integer)
returns text language plpgsql security invoker as $$
declare actual integer;
begin
 begin
  actual := public.claim_pending_advisor_projects();
  if actual <> expected then raise exception 'FAIL claim expected %, got %', expected, actual; end if;
  raise exception 'claim_rollback';
 exception when others then if sqlerrm <> 'claim_rollback' then raise; end if; end;
 return 'claim_count_ok: ' || expected;
end $$;
create or replace function pg_temp.link_probe(target_email text)
returns text language plpgsql security invoker as $$
declare linked boolean;
begin
 begin
  linked := public.set_project_advisor('12500000-0000-4000-8000-000000000001', target_email);
  if linked = current_setting('test.hardened')::boolean then raise exception 'FAIL link eligibility'; end if;
  if current_setting('test.hardened')::boolean and not exists (
    select 1 from public.projects where id='12500000-0000-4000-8000-000000000001' and advisor_id is null and advisor_email=target_email
  ) then raise exception 'FAIL pending invitation'; end if;
  raise exception 'link_rollback';
 exception when others then if sqlerrm <> 'link_rollback' then raise; end if; end;
 return 'link_eligibility_ok';
end $$;

set role authenticated;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
set request.jwt.claim.email='student@example.invalid';
select pg_temp.probe('SEC03 forged completed INSERT', $$insert into public.research_workflows(project_id,owner_id,state,stable_state,content) values ('12500000-0000-4000-8000-000000000001',auth.uid(),'completed','completed','{}')$$, 'student_workflow_initial_state_required');
select pg_temp.probe('SEC03 forged reviews INSERT', $$insert into public.research_workflows(project_id,owner_id,content) values ('12500000-0000-4000-8000-000000000001',auth.uid(),'{"advisorReviews":[{"status":"approved"}]}')$$, 'workflow_initial_reviews_must_be_empty');
select pg_temp.probe('SEC03 workflow DELETE', $$delete from public.research_workflows where project_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$, 'permission denied for table research_workflows');
select pg_temp.probe('SEC03 owner approves existing review', $$update public.research_workflows set content=jsonb_set(content,'{advisorReviews,0,status}','"approved"'),revision=revision+1 where project_id='12500000-0000-4000-8000-000000000002'$$, 'workflow_review_history_immutable');
select pg_temp.probe('SEC03 owner erases review history', $$update public.research_workflows set content=jsonb_set(content,'{advisorReviews}','[]'),revision=revision+1 where project_id='12500000-0000-4000-8000-000000000002'$$, 'workflow_review_history_immutable');
select pg_temp.probe('SEC03 owner changes decision target', $$update public.research_workflows set content=jsonb_set(content,'{advisorReviews,0,targetStableState}','"completed"'),revision=revision+1 where project_id='12500000-0000-4000-8000-000000000002'$$, 'workflow_review_history_immutable');
select pg_temp.probe('SEC03 missing review transition', $$update public.research_workflows set content=jsonb_set(content,'{advisorReviews}',(content->'advisorReviews') || '[{"id":"new-review","status":"pending","advisorEmail":"advisor@example.invalid"}]'),revision=revision+1 where project_id='12500000-0000-4000-8000-000000000002'$$, 'student_advisor_review_transition_invalid');
select pg_temp.probe('SEC03 missing review status', $$update public.research_workflows set content=jsonb_set(content,'{advisorReviews}',(content->'advisorReviews') || '[{"id":"new-review","advisorEmail":"advisor@example.invalid","step":"problem_statement","targetState":"validating_general_objective","targetStableState":"validating_general_objective","targetActiveStep":"general_objective"}]'),revision=revision+1 where project_id='12500000-0000-4000-8000-000000000002'$$, 'student_advisor_review_request_invalid');
select pg_temp.link_probe('unconfirmed@example.invalid');
select pg_temp.link_probe('password@example.invalid');
select pg_temp.link_probe('mismatch@example.invalid');
select pg_temp.probe('SEC01 direct INSERT with unverified advisor', $$insert into public.projects(owner_id,title,advisor_id,advisor_email) values (auth.uid(),'Bypass direct link','55555555-5555-4555-8555-555555555555','unconfirmed@example.invalid')$$, 'verified_google_advisor_required');

set request.jwt.claim.sub='88888888-8888-4888-8888-888888888888';
select pg_temp.probe('SEC01 unconfirmed student links advisor', $$select public.set_project_advisor('88888888-0000-4000-8000-000000000001','advisor@example.invalid')$$, 'verified_google_identity_required');
set request.jwt.claim.sub='55555555-5555-4555-8555-555555555555';
select pg_temp.claim_probe(case when current_setting('test.hardened')::boolean then 0 else 1 end);
set request.jwt.claim.sub='66666666-6666-4666-8666-666666666666';
select pg_temp.claim_probe(case when current_setting('test.hardened')::boolean then 0 else 1 end);
set request.jwt.claim.sub='77777777-7777-4777-8777-777777777777';
select pg_temp.claim_probe(case when current_setting('test.hardened')::boolean then 0 else 1 end);
set request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
select pg_temp.claim_probe(1);
reset role;

set role anon;
set request.jwt.claim.sub='';
select pg_temp.probe('SEC05 anonymous priority urgent', $$insert into public.bug_reports(reporter_email,subject,message,priority) values ('test@example.invalid','Synthetic bug','Synthetic test message','urgent')$$, 'permission denied for table bug_reports');
select pg_temp.probe('SEC05 anonymous forged triage', $$insert into public.bug_reports(reporter_email,subject,message,status,admin_notes,resolved_at) values ('test@example.invalid','Synthetic bug','Synthetic test message','closed','forged',now())$$, 'permission denied for table bug_reports');
-- Same payload as the route, with server-owned defaults supplied by PostgreSQL.
insert into public.bug_reports(id,reporter_email,subject,message,attachment_size,attachment_type)
values (gen_random_uuid(),'test@example.invalid','Synthetic bug','Synthetic test message',5242880,'image/png');
reset role;
do $$ begin
 if exists(select 1 from public.bug_reports where priority<>'normal' or status<>'new' or admin_notes is not null or resolved_at is not null)
 then raise exception 'FAIL intake defaults'; end if;
end $$;
begin;
set local role authenticated;
set local request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
set local request.jwt.claim.email='student@example.invalid';
update public.research_workflows set content=jsonb_set(content,'{advisorReviews}',
 (content->'advisorReviews') || '[{"id":"resubmitted","status":"pending","advisorEmail":"advisor@example.invalid","step":"problem_statement","targetState":"validating_general_objective","targetStableState":"validating_general_objective","targetActiveStep":"general_objective","advisorId":null,"advisorComments":null,"reviewedAt":null}]'),revision=revision+1
where project_id='12500000-0000-4000-8000-000000000002';
do $$ begin
 if not exists(select 1 from public.research_workflows where project_id='12500000-0000-4000-8000-000000000002'
 and content #>> '{advisorReviews,0,advisorComments}'='Revise the question'
 and content #>> '{advisorReviews,1,status}'='pending') then raise exception 'FAIL resubmission'; end if;
end $$;
-- Normal creation and parent deletion retain the database's cascade behavior.
insert into public.research_workflows(project_id,owner_id,content)
values ('12500000-0000-4000-8000-000000000001',auth.uid(),'{"activeStep":null,"advisorReviews":[],"originalText":"preserve this"}');
delete from public.projects where id='12500000-0000-4000-8000-000000000001';
do $$ begin
 if exists(select 1 from public.research_workflows where project_id='12500000-0000-4000-8000-000000000001') then raise exception 'FAIL parent cascade'; end if;
end $$;
-- Legitimate authenticated report, ordinary author cannot triage.
insert into public.bug_reports(id,reporter_id,reporter_email,subject,message) values
 ('12500000-0000-4000-8000-000000000099',auth.uid(),'student@example.invalid','Synthetic report','Synthetic report message');
do $$ declare n integer; begin
 update public.bug_reports set status='closed' where id='12500000-0000-4000-8000-000000000099';
 get diagnostics n=row_count;
 if n<>0 then raise exception 'FAIL reporter can triage'; end if;
end $$;
-- Existing admin policy is preserved (synthetic JWT email, not a real session).
set local request.jwt.claim.email='marioreis@id.uff.br';
update public.bug_reports set status='in_review',priority='urgent',admin_notes='Synthetic triage'
where id='12500000-0000-4000-8000-000000000099';
do $$ begin
 if not exists(select 1 from public.bug_reports where id='12500000-0000-4000-8000-000000000099' and priority='urgent' and status='in_review') then raise exception 'FAIL admin triage'; end if;
end $$;
rollback;
select 'resubmission_and_bug_report_roles_ok';
begin;
set local role authenticated;
set local request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
-- Exactly the transition generated when a student revalidates the problem
-- after reaching methodology: the advisor must review, progression stays put.
do $$ declare request jsonb; invalid_request jsonb; caught text; begin
 request := '{"id":"revisit-invalid","status":"pending","advisorEmail":"advisor@example.invalid","step":"problem_statement","targetState":"validating_methodology","targetStableState":"validating_methodology","targetActiveStep":"methodology_matrix"}';
 if current_setting('test.hardened')::boolean then
  for invalid_request in select value from jsonb_array_elements(jsonb_build_array(
   request - 'targetState',
   request || '{"targetStableState":"completed"}',
   request || '{"targetActiveStep":"final_map"}',
   request || '{"step":"final_map"}',
   request || '{"step":"general_objective"}'
  )) loop
   caught := null;
   begin
    update public.research_workflows set content=jsonb_set(content,'{advisorReviews}',jsonb_build_array(invalid_request)),revision=revision+1
    where project_id='12500000-0000-4000-8000-000000000003';
    raise exception 'unexpected_allowed';
   exception when others then caught := sqlerrm;
   end;
   if caught <> 'student_advisor_review_transition_invalid' then raise exception 'FAIL invalid revisit: %', caught; end if;
  end loop;
 end if;
end $$;
update public.research_workflows set content=jsonb_set(content,'{advisorReviews}',
'[{"id":"revisit-problem","status":"pending","advisorEmail":"advisor@example.invalid","step":"problem_statement","targetState":"validating_methodology","targetStableState":"validating_methodology","targetActiveStep":"methodology_matrix","advisorId":null,"advisorComments":null,"reviewedAt":null}]'),revision=revision+1
where project_id='12500000-0000-4000-8000-000000000003';
do $$ begin
 if not exists(select 1 from public.research_workflows where project_id='12500000-0000-4000-8000-000000000003'
 and stable_state='validating_methodology' and content #>> '{advisorReviews,0,status}'='pending'
 and content #>> '{elements,0,approvedContent}'='Original problem preserved') then raise exception 'FAIL revisiting earlier step'; end if;
end $$;
rollback;
select 'earlier_step_revalidation_preserved';
select case when current_setting('test.hardened')::boolean then 'c125_hardened_pass' else 'c125_baseline_vulnerabilities_reproduced' end;
