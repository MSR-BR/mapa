\set ON_ERROR_STOP on
-- Synthetic projects only. Migration extraction must preserve every legacy entry.
do $$ begin
  if (select count(*) from public.workflow_versions where kind='legacy') <> 1000 then raise exception 'legacy_count'; end if;
  if exists(select 1 from public.research_workflows where jsonb_array_length(content->'elementVersions')<>0) then raise exception 'history_in_payload'; end if;
  if has_table_privilege('anon','public.workflow_versions','select') or has_table_privilege('authenticated','public.workflow_versions','insert,update,delete') then raise exception 'history_privileges'; end if;
end $$;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000004';
do $$ begin
  if (select count(*) from public.workflow_versions)<>0 then raise exception 'other_user_history_leak'; end if;
end $$;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000003';
do $$ begin
  if (select count(*) from public.workflow_versions where project_id='00000000-0000-4000-8000-000000000005')<>7 then raise exception 'student_own_history'; end if;
  if (select count(*) from public.workflow_versions where project_id='00000000-0000-4000-8000-000000000002')<>0 then raise exception 'student_other_history'; end if;
end $$;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';
do $$ begin
  if (select count(*) from public.workflow_versions where project_id='00000000-0000-4000-8000-000000000005')<>7 then raise exception 'linked_advisor_history'; end if;
  begin
    delete from public.workflow_versions;
    raise exception 'history_was_mutable';
  exception when insufficient_privilege then null; end;
  begin
    update public.research_workflows set content=content-'historyVersion',revision=revision+1 where project_id='00000000-0000-4000-8000-000000000002';
    raise exception 'old_client_accepted';
  exception when raise_exception then if sqlerrm<>'workflow_client_upgrade_required' then raise; end if; end;
end $$;
reset role;
set request.jwt.claim.sub = '';

-- Owner in the wrong mode cannot read any history, even by direct Data API.
update public.user_profiles set active_role='student',role_version=role_version+1 where user_id='00000000-0000-4000-8000-000000000001';
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';
do $$ begin
  if (select count(*) from public.workflow_versions)<>0 then raise exception 'wrong_mode_history_leak'; end if;
end $$;
reset role;
set request.jwt.claim.sub = '';
update public.user_profiles set active_role='advisor',role_version=role_version+1 where user_id='00000000-0000-4000-8000-000000000001';

-- Explicit draft write and no-op write: historical body separate, confirmed body unchanged.
do $$ declare body jsonb; unit jsonb; n bigint; begin
  select content into body from public.research_workflows where project_id='00000000-0000-4000-8000-000000000002';
  unit := private.workflow_unit(body,'general_objective');
  unit := jsonb_set(unit,'{elements,0,proposedContent}','"Texto sintético de rascunho C111."');
  perform set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
  update public.research_workflows set content=jsonb_set(body,'{stepDrafts,general_objective}',jsonb_build_object('baseRevision',5,'savedAt',now(),'unit',unit)),revision=11 where project_id='00000000-0000-4000-8000-000000000002' and revision=10;
  if (select content->'elements' from public.research_workflows where project_id='00000000-0000-4000-8000-000000000002') is distinct from body->'elements' then raise exception 'draft_changed_canonical'; end if;
  select count(*) into n from public.workflow_versions;
  update public.research_workflows set revision=12 where project_id='00000000-0000-4000-8000-000000000002';
  if (select count(*) from public.workflow_versions)<>n then raise exception 'noop_archived'; end if;
  update public.research_workflows set revision=99 where project_id='00000000-0000-4000-8000-000000000002' and revision=10;
  if found then raise exception 'concurrent_overwrite'; end if;
end $$;

-- Revalidation of an earlier student step preserves progress and freezes submitted content.
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000003';
do $$ declare body jsonb; review jsonb; begin
  select content into body from public.research_workflows where project_id='00000000-0000-4000-8000-000000000005';
  review:=jsonb_build_object('id','00000000-0000-4000-8000-000000000099','step','general_objective','status','pending','advisorEmail','author@example.invalid','advisorId',null,'advisorComments',null,'requestedAt',now(),'reviewedAt',null,'sourceRevision',6,'targetState','completed','targetStableState','completed','targetActiveStep',null);
  update public.research_workflows set content=jsonb_set(body,'{advisorReviews}',jsonb_build_array(review)),revision=11,source_revision=6 where project_id='00000000-0000-4000-8000-000000000005';
  begin
    update public.research_workflows set content=jsonb_set(content,'{elements,0,proposedContent}','"Bypass sintético"'),revision=12 where project_id='00000000-0000-4000-8000-000000000005';
    raise exception 'submitted_body_changed';
  exception when raise_exception then if sqlerrm<>'workflow_submitted_revision_frozen' then raise; end if; end;
end $$;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';
do $$ declare body jsonb; begin
  select content into body from public.research_workflows where project_id='00000000-0000-4000-8000-000000000005';
  body:=jsonb_set(jsonb_set(jsonb_set(body,'{advisorReviews,0,status}','"approved"'),'{advisorReviews,0,advisorId}','"00000000-0000-4000-8000-000000000001"'),'{advisorReviews,0,reviewedAt}',to_jsonb(now()));
  update public.research_workflows set content=body,revision=12,updated_at=now() where project_id='00000000-0000-4000-8000-000000000005';
end $$;
reset role;
set request.jwt.claim.sub = '';

-- Measure payload independently of historical growth, including indexes.
do $$ declare body jsonb; unit jsonb; initial_bytes integer; sample integer; begin
  select content into body from public.research_workflows where project_id='00000000-0000-4000-8000-000000000002';
  initial_bytes:=octet_length(body::text);
  unit:=private.workflow_unit(body,'methodology_matrix');
  foreach sample in array array[0,100,300,1000] loop
    insert into public.workflow_versions(project_id,revision,source_revision,step,kind,reason,unit)
      select '00000000-0000-4000-8000-000000000002',1000+g,5,'methodology_matrix','draft','Capacidade sintética',jsonb_set(unit,'{methodologyRows,0,studentJustification}',to_jsonb('Edição sintética número '||g))
      from generate_series(1,sample) g on conflict do nothing;
    if (select octet_length(content::text) from public.research_workflows where project_id='00000000-0000-4000-8000-000000000002')<>initial_bytes then raise exception 'payload_grew_with_history'; end if;
    raise notice 'history sample %, current payload bytes %',sample,initial_bytes;
  end loop;
end $$;
select jsonb_build_object('status','c111_database_pass','versions',(select count(*) from public.workflow_versions),'logical_version_bytes',(select round(avg(octet_length(unit::text))) from public.workflow_versions where kind<>'legacy'),'table_bytes',pg_table_size('public.workflow_versions'),'index_bytes',pg_indexes_size('public.workflow_versions'),'current_payload_bytes',(select octet_length(content::text) from public.research_workflows where project_id='00000000-0000-4000-8000-000000000002'));
