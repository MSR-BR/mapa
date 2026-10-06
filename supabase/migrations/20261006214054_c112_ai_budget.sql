-- C112: one monthly counter, no prompts/content/PII. Fail closed until configured.
create table if not exists private.ai_budget_config (
  singleton boolean primary key default true check (singleton),
  secret_hash text not null check (secret_hash ~ '^[a-f0-9]{64}$'),
  monthly_limit_micros bigint not null default 0 check (monthly_limit_micros between 0 and 100000000)
);
create table if not exists private.ai_budget_months (
  period date primary key,
  reserved_micros bigint not null default 0 check (reserved_micros >= 0),
  attempts bigint not null default 0 check (attempts >= 0)
);
alter table private.ai_budget_config enable row level security;
alter table private.ai_budget_months enable row level security;
revoke all on table private.ai_budget_config from public, anon, authenticated, service_role;
revoke all on table private.ai_budget_months from public, anon, authenticated, service_role;

create or replace function private.reserve_ai_budget(p_secret text, p_micros integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  configured private.ai_budget_config%rowtype;
  month_start date := date_trunc('month', current_timestamp at time zone 'America/Sao_Paulo')::date;
  changed integer;
begin
  if auth.uid() is null or p_secret is null or length(p_secret) < 32
    or p_micros is null or p_micros < 1 or p_micros > 250000 then
    return false;
  end if;
  select * into configured from private.ai_budget_config where singleton;
  if not found or configured.monthly_limit_micros = 0
    or configured.secret_hash <> encode(sha256(convert_to(p_secret, 'UTF8')), 'hex') then
    return false;
  end if;
  insert into private.ai_budget_months(period) values (month_start) on conflict do nothing;
  -- Conditional UPDATE locks the counter. Concurrent callers recheck the balance.
  update private.ai_budget_months set reserved_micros = reserved_micros + p_micros, attempts = attempts + 1
    where period = month_start and reserved_micros + p_micros <= configured.monthly_limit_micros;
  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;
revoke all on function private.reserve_ai_budget(text,integer) from public, anon, authenticated, service_role;
grant execute on function private.reserve_ai_budget(text,integer) to authenticated;

create or replace function public.reserve_ai_budget(p_secret text, p_micros integer)
returns boolean language sql security invoker set search_path = '' as $$
  select private.reserve_ai_budget(p_secret, p_micros);
$$;
revoke all on function public.reserve_ai_budget(text,integer) from public, anon, authenticated, service_role;
grant execute on function public.reserve_ai_budget(text,integer) to authenticated;
