-- C130: owner authorized increase 23/10/2026. Target: aeaweherkrqmlqnxsmib.
-- Compare-and-set, no reset of consumption, credentials or provider settings.
begin;
do $$
begin
  perform 1 from private.ai_budget_config where singleton for update;
  if not exists (select 1 from private.ai_budget_config where singleton and monthly_limit_micros in (5000000,100000000)) then
    raise exception 'Unexpected budget configuration: no change applied';
  end if;
  update private.ai_budget_config set monthly_limit_micros=100000000
  where singleton and monthly_limit_micros=5000000;
end $$;
select current_timestamp as checked_at, c.monthly_limit_micros, m.period,
 m.reserved_micros, m.attempts,
 c.monthly_limit_micros-coalesce(m.reserved_micros,0) as remaining_micros
from private.ai_budget_config c left join private.ai_budget_months m
 on m.period=date_trunc('month',now() at time zone 'America/Sao_Paulo')::date;
commit;
