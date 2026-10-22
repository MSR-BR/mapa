\set ON_ERROR_STOP on
set role authenticated;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
do $$ declare result jsonb; n integer; begin
 result := public.reserve_advisor_reminder('12700000-0000-4000-8000-000000000001','current-review');
 if result->>'allowed'<>'true' or result->>'recipient_email'<>'advisor@example.invalid' or result->>'reservation_id' is null then raise exception 'first reminder denied or spoofed'; end if;
 result := public.reserve_advisor_reminder('12700000-0000-4000-8000-000000000001','current-review');
 if result->>'code'<>'reminder_cooldown' or (result->>'retry_after')::int not between 1 and 86400 then raise exception 'cooldown failed'; end if;
 if public.reserve_advisor_reminder('12700000-0000-4000-8000-000000000001','forged-review')->>'code'<>'review_unavailable' then raise exception 'forged review accepted'; end if;
 for n in 2..5 loop
  result := public.reserve_advisor_reminder(('12700000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'current-review');
  if result->>'allowed'<>'true' then raise exception 'valid distinct reminder denied'; end if;
 end loop;
 if public.reserve_advisor_reminder('12700000-0000-4000-8000-000000000006','current-review')->>'code'<>'reminder_limit' then raise exception 'actor limit bypass'; end if;
end $$;
-- Direct deletion of a project must not restore the actor's global allowance.
delete from public.projects where id='12700000-0000-4000-8000-000000000005';
do $$ begin
 if public.reserve_advisor_reminder('12700000-0000-4000-8000-000000000006','current-review')->>'code'<>'reminder_limit' then raise exception 'deletion bypass'; end if;
end $$;
set request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
do $$ declare r jsonb; begin
 r:=public.reserve_advisor_reminder('12700000-0000-4000-8000-000000000001','current-review');
 if r->>'allowed'<>'true' or r->>'recipient_email'<>'student@example.invalid' then raise exception 'advisor canonical recipient failed'; end if;
end $$;
set request.jwt.claim.sub='33333333-3333-4333-8333-333333333333';
do $$ begin
 if public.reserve_advisor_reminder('12700000-0000-4000-8000-000000000001','current-review')->>'code'<>'permission_denied' then raise exception 'other user allowed'; end if;
end $$;
set request.jwt.claim.sub='';
do $$ begin
 if public.reserve_advisor_reminder('12700000-0000-4000-8000-000000000001','current-review')->>'code'<>'auth_required' then raise exception 'missing auth allowed'; end if;
end $$;
reset role;
update private.advisor_reminder_actors set attempts_at=array[now()-interval '25 hours'];
set role authenticated;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
do $$ begin
 if public.reserve_advisor_reminder('12700000-0000-4000-8000-000000000006','current-review')->>'allowed'<>'true' then raise exception 'expiry reset failed'; end if;
 if public.reserve_advisor_reminder('12700000-0000-4000-8000-000000000001','current-review')->>'code'<>'reminder_cooldown' then raise exception 'actor reset erased review cooldown'; end if;
end $$;
reset role;
update public.user_profiles set active_role='advisor' where user_id='11111111-1111-4111-8111-111111111111';
set role authenticated;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
do $$ begin
 if public.reserve_advisor_reminder('12700000-0000-4000-8000-000000000002','current-review')->>'code'<>'permission_denied' then raise exception 'inactive mode allowed'; end if;
end $$;
reset role;
update public.user_profiles set active_role='student' where user_id='11111111-1111-4111-8111-111111111111';
update private.advisor_reminder_reservations set reserved_at=now()-interval '25 hours';
set role authenticated;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
do $$ begin
 if public.reserve_advisor_reminder('12700000-0000-4000-8000-000000000001','current-review')->>'allowed'<>'true' then raise exception 'review expiry failed'; end if;
end $$;
reset role;
select 'reminder_sql_behavior_ok';
