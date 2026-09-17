begin;

-- C087 rollout phase 1: expose only the versioned role-switch RPC. The table
-- remains immutable to Data API clients, so mode changes keep their optimistic
-- concurrency and audit guarantees.
do $$
begin
  if to_regprocedure('public.switch_active_role(text,bigint,uuid)') is null then
    raise exception 'c087_switch_active_role_rpc_missing';
  end if;
end
$$;

revoke all on function public.switch_active_role(text, bigint, uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.switch_active_role(text, bigint, uuid)
  to authenticated;

revoke update on table public.user_profiles from authenticated;

comment on function public.switch_active_role(text, bigint, uuid) is
  'Troca atômica e idempotente do modo ativo; disponível somente a usuários autenticados.';

commit;
