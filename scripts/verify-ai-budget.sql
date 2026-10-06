do $$
begin
 if has_function_privilege('anon','public.reserve_ai_budget(text,integer)','EXECUTE')
   or has_function_privilege('service_role','public.reserve_ai_budget(text,integer)','EXECUTE')
   or not has_function_privilege('authenticated','public.reserve_ai_budget(text,integer)','EXECUTE') then raise exception 'bad_rpc_grants'; end if;
 if has_table_privilege('authenticated','private.ai_budget_config','SELECT,INSERT,UPDATE,DELETE')
   or has_table_privilege('anon','private.ai_budget_months','SELECT,INSERT,UPDATE,DELETE') then raise exception 'exposed_budget'; end if;
end $$;
set role authenticated;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
do $$ begin if public.reserve_ai_budget('c112-synthetic-secret-at-least-32-characters',250) then raise exception 'default_must_deny'; end if; end $$;
reset role;
insert into private.ai_budget_config(singleton,secret_hash,monthly_limit_micros)
values(true,encode(sha256(convert_to('c112-synthetic-secret-at-least-32-characters','UTF8')),'hex'),1000);
set role authenticated;
do $$ begin
 if public.reserve_ai_budget('c112-wrong-secret-at-least-32-characters',250)
   or public.reserve_ai_budget('c112-synthetic-secret-at-least-32-characters',0)
   or public.reserve_ai_budget('c112-synthetic-secret-at-least-32-characters',-1)
   or public.reserve_ai_budget('c112-synthetic-secret-at-least-32-characters',250001) then raise exception 'invalid_reservation_allowed'; end if;
end $$;
set request.jwt.claim.sub='';
do $$ begin if public.reserve_ai_budget('c112-synthetic-secret-at-least-32-characters',250) then raise exception 'auth_required'; end if; end $$;
reset role;
