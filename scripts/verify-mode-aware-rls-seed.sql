insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'student@example.invalid'),
  ('22222222-2222-4222-8222-222222222222', 'advisor@example.invalid'),
  ('33333333-3333-4333-8333-333333333333', 'other-advisor@example.invalid'),
  ('44444444-4444-4444-8444-444444444444', 'no-profile@example.invalid');

insert into public.user_profiles (user_id, active_role) values
  ('11111111-1111-4111-8111-111111111111', 'student'),
  ('22222222-2222-4222-8222-222222222222', 'advisor'),
  ('33333333-3333-4333-8333-333333333333', 'advisor');

insert into public.projects (
  id, owner_id, title, advisor_id, advisor_email, workflow_version
) values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    'Projeto estudantil vinculado',
    '22222222-2222-4222-8222-222222222222',
    'advisor@example.invalid',
    2
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '22222222-2222-4222-8222-222222222222',
    'Projeto autônomo do orientador',
    null,
    null,
    2
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    '22222222-2222-4222-8222-222222222222',
    'Projeto histórico do orientador como aluno',
    '33333333-3333-4333-8333-333333333333',
    'other-advisor@example.invalid',
    2
  ),
  (
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    '11111111-1111-4111-8111-111111111111',
    'Projeto estudantil com convite pendente',
    null,
    'advisor@example.invalid',
    2
  );

insert into public.research_workflows (
  project_id,
  owner_id,
  state,
  stable_state,
  content,
  validation_state
) values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    'choosing_problem',
    'choosing_problem',
    '{
      "activeStep": 1,
      "academic": "preserved",
      "advisorReviews": [{
        "id": "review-1",
        "status": "pending",
        "advisorComments": null,
        "advisorId": null,
        "reviewedAt": null,
        "targetState": "validating_general_objective",
        "targetStableState": "validating_general_objective",
        "targetActiveStep": 2
      }]
    }'::jsonb,
    '{}'::jsonb
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '22222222-2222-4222-8222-222222222222',
    'draft_prompt',
    'draft_prompt',
    '{"activeStep": 0}'::jsonb,
    '{}'::jsonb
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    '22222222-2222-4222-8222-222222222222',
    'draft_prompt',
    'draft_prompt',
    '{"activeStep": 0}'::jsonb,
    '{}'::jsonb
  );

insert into public.generation_jobs (
  id,
  project_id,
  owner_id,
  idempotency_key,
  status
) values
  (
    '10000000-0000-4000-8000-000000000001',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    '10000000-0000-4000-8000-000000000011',
    'queued'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '22222222-2222-4222-8222-222222222222',
    '10000000-0000-4000-8000-000000000012',
    'queued'
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    '22222222-2222-4222-8222-222222222222',
    '10000000-0000-4000-8000-000000000013',
    'queued'
  );

insert into public.research_structures (
  project_id,
  owner_id,
  schema_version,
  prompt_version,
  model,
  content
) values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    '1',
    '1',
    'fixture',
    '{}'::jsonb
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '22222222-2222-4222-8222-222222222222',
    '1',
    '1',
    'fixture',
    '{}'::jsonb
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    '22222222-2222-4222-8222-222222222222',
    '1',
    '1',
    'fixture',
    '{}'::jsonb
  );

insert into public.legal_consents (
  user_id,
  profile_role,
  terms_version
) values
  ('11111111-1111-4111-8111-111111111111', 'student', 'fixture'),
  ('11111111-1111-4111-8111-111111111111', 'advisor', 'fixture'),
  ('22222222-2222-4222-8222-222222222222', 'advisor', 'fixture'),
  ('22222222-2222-4222-8222-222222222222', 'student', 'fixture');
