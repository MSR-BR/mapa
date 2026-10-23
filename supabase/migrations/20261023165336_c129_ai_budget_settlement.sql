-- C129: additive ledger. The existing month counter remains committed exposure
-- (legacy charges + unsettled reservations + settled costs), never reset here.
create table private.ai_budget_reservations (
  id uuid primary key,
  owner_id uuid not null,
  period date not null references private.ai_budget_months(period),
  reserved_micros integer not null check (reserved_micros between 1 and 250000),
  actual_micros bigint check (actual_micros between 0 and 1000000000),
  provider text not null check (provider in ('gemini','openai')),
  model text not null check (length(model) between 1 and 100),
  operation text not null check (length(operation) between 1 and 100),
  input_tokens bigint check (input_tokens between 0 and 1000000000),
  output_tokens bigint check (output_tokens between 0 and 1000000000),
  created_at timestamptz not null default now(),
  settled_at timestamptz,
  check ((actual_micros is null and settled_at is null and input_tokens is null and output_tokens is null)
    or (actual_micros is not null and settled_at is not null and input_tokens is not null and output_tokens is not null))
);
create index ai_budget_reservations_period_idx on private.ai_budget_reservations(period);
alter table private.ai_budget_reservations enable row level security;
revoke all on table private.ai_budget_reservations from public, anon, authenticated, service_role;

create function private.reserve_ai_budget_v2(p_secret text, p_id uuid, p_micros integer, p_provider text, p_model text, p_operation text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  configured private.ai_budget_config%rowtype;
  month_start date := date_trunc('month',current_timestamp at time zone 'America/Sao_Paulo')::date;
  changed integer;
  exposure bigint;
  pressure text;
begin
  if auth.uid() is null or p_secret is null or length(p_secret)<32 or p_id is null
    or p_micros is null or p_micros<1 or p_micros>250000
    or p_provider is null or p_provider not in ('gemini','openai')
    or p_model is null or length(p_model) not between 1 and 100
    or p_operation is null or length(p_operation) not between 1 and 100 then
    return jsonb_build_object('allowed',false,'code','configuration');
  end if;
  -- One lock order across reserve/settle prevents races and deadlocks.
  select * into configured from private.ai_budget_config where singleton for update;
  if not found or configured.secret_hash<>encode(sha256(convert_to(p_secret,'UTF8')),'hex') then
    return jsonb_build_object('allowed',false,'code','configuration');
  end if;
  -- Duplicate admission never authorizes a second provider call, including after settlement.
  if exists(select 1 from private.ai_budget_reservations where id=p_id) then
    return jsonb_build_object('allowed',false,'code','reservation_exists');
  end if;
  insert into private.ai_budget_months(period) values(month_start) on conflict do nothing;
  update private.ai_budget_months set reserved_micros=reserved_micros+p_micros, attempts=attempts+1
    where period=month_start and reserved_micros+p_micros<=configured.monthly_limit_micros;
  get diagnostics changed = row_count;
  if changed=0 then return jsonb_build_object('allowed',false,'code','budget'); end if;
  select reserved_micros into exposure from private.ai_budget_months where period=month_start;
  -- Emit at most one transition per threshold and month; no amounts or user IDs
  -- are returned to the application log.
  pressure := case
    when exposure*100 >= configured.monthly_limit_micros*95
      and (exposure-p_micros)*100 < configured.monthly_limit_micros*95 then '95'
    when exposure*100 >= configured.monthly_limit_micros*80
      and (exposure-p_micros)*100 < configured.monthly_limit_micros*80 then '80'
    else null end;
  insert into private.ai_budget_reservations(id,owner_id,period,reserved_micros,provider,model,operation)
    values(p_id,auth.uid(),month_start,p_micros,p_provider,p_model,p_operation);
  return jsonb_build_object('allowed',true,'pressure',pressure);
end;
$$;
revoke all on function private.reserve_ai_budget_v2(text,uuid,integer,text,text,text) from public, anon, authenticated, service_role;
grant execute on function private.reserve_ai_budget_v2(text,uuid,integer,text,text,text) to authenticated;

create function private.settle_ai_budget(p_secret text, p_id uuid, p_actual_micros bigint, p_input_tokens bigint, p_output_tokens bigint)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  configured private.ai_budget_config%rowtype;
  reservation private.ai_budget_reservations%rowtype;
begin
  if auth.uid() is null or p_secret is null or length(p_secret)<32 or p_id is null
    or p_actual_micros is null or p_actual_micros<0 or p_actual_micros>1000000000
    or p_input_tokens is null or p_input_tokens<0 or p_input_tokens>1000000000
    or p_output_tokens is null or p_output_tokens<0 or p_output_tokens>1000000000 then return false; end if;
  select * into configured from private.ai_budget_config where singleton for update;
  if not found or configured.secret_hash<>encode(sha256(convert_to(p_secret,'UTF8')),'hex') then return false; end if;
  select * into reservation from private.ai_budget_reservations where id=p_id and owner_id=auth.uid() for update;
  if not found then return false; end if;
  if reservation.actual_micros is not null then
    return reservation.actual_micros=p_actual_micros and reservation.input_tokens=p_input_tokens and reservation.output_tokens=p_output_tokens;
  end if;
  -- Charge even an unexpected overrun; never hide paid usage by clipping to the estimate.
  -- Settlement is on the original period, including calls crossing midnight/month-end.
  update private.ai_budget_months set reserved_micros=reserved_micros-reservation.reserved_micros+p_actual_micros
    where period=reservation.period;
  update private.ai_budget_reservations set actual_micros=p_actual_micros,
    input_tokens=p_input_tokens,output_tokens=p_output_tokens,settled_at=now() where id=p_id;
  return true;
end;
$$;
revoke all on function private.settle_ai_budget(text,uuid,bigint,bigint,bigint) from public, anon, authenticated, service_role;
grant execute on function private.settle_ai_budget(text,uuid,bigint,bigint,bigint) to authenticated;

create function public.reserve_ai_budget_v2(p_secret text, p_id uuid, p_micros integer, p_provider text, p_model text, p_operation text)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.reserve_ai_budget_v2(p_secret,p_id,p_micros,p_provider,p_model,p_operation);
$$;
revoke all on function public.reserve_ai_budget_v2(text,uuid,integer,text,text,text) from public, anon, authenticated, service_role;
grant execute on function public.reserve_ai_budget_v2(text,uuid,integer,text,text,text) to authenticated;

create function public.settle_ai_budget(p_secret text, p_id uuid, p_actual_micros bigint, p_input_tokens bigint, p_output_tokens bigint)
returns boolean language sql security invoker set search_path = '' as $$
  select private.settle_ai_budget(p_secret,p_id,p_actual_micros,p_input_tokens,p_output_tokens);
$$;
revoke all on function public.settle_ai_budget(text,uuid,bigint,bigint,bigint) from public, anon, authenticated, service_role;
grant execute on function public.settle_ai_budget(text,uuid,bigint,bigint,bigint) to authenticated;
