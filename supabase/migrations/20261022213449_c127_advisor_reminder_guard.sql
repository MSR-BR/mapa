begin;

-- Private counters contain identifiers/times only, never e-mail bodies or addresses.
create table private.advisor_reminder_actors (
  actor_id uuid primary key references auth.users(id) on delete cascade,
  attempts_at timestamptz[] not null default '{}'::timestamptz[] check (cardinality(attempts_at) <= 5)
);
create table private.advisor_reminder_reservations (
  project_id uuid not null references public.projects(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  review_id text not null check (length(review_id) between 1 and 100),
  reservation_id uuid not null,
  reserved_at timestamptz not null,
  primary key (project_id, actor_id, review_id)
);
alter table private.advisor_reminder_actors enable row level security;
alter table private.advisor_reminder_reservations enable row level security;
revoke all on table private.advisor_reminder_actors from public, anon, authenticated, service_role;
revoke all on table private.advisor_reminder_reservations from public, anon, authenticated, service_role;
create index advisor_reminder_reservations_actor_time on private.advisor_reminder_reservations(actor_id, reserved_at);

-- Authorization and reservation are atomic across application instances. Caller
-- cannot choose actor, recipient, time, limit or idempotency key. No refund on an
-- uncertain delivery: a timeout can happen after the provider accepted the email.
create function public.reserve_advisor_reminder(p_project_id uuid, p_review_id text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  project_row public.projects%rowtype;
  review jsonb;
  recipient text;
  actor_bucket private.advisor_reminder_actors%rowtype;
  previous_at timestamptz;
  recent_attempts timestamptz[];
  current_time_value timestamptz;
  reservation uuid;
begin
  if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    return jsonb_build_object('allowed', false, 'code', 'auth_required');
  end if;
  if p_review_id is null or length(p_review_id) not between 1 and 100 then
    return jsonb_build_object('allowed', false, 'code', 'review_unavailable');
  end if;
  select * into project_row from public.projects p where p.id=p_project_id and p.deleted_at is null and p.workflow_version=2;
  if not found or not (private.project_owned_in_active_mode(p_project_id,project_row.owner_id)
    or private.project_reviewable_by_active_advisor(p_project_id,project_row.owner_id)) then
    return jsonb_build_object('allowed', false, 'code', 'permission_denied');
  end if;
  select entry.value into review from public.research_workflows w,
    lateral jsonb_array_elements(coalesce(w.content->'advisorReviews','[]'::jsonb)) with ordinality entry(value,position)
    where w.project_id=p_project_id and entry.value->>'status' in ('pending','changes_requested')
    order by entry.position desc limit 1;
  if review is null or review->>'id' is distinct from p_review_id then
    return jsonb_build_object('allowed', false, 'code', 'review_unavailable');
  end if;
  -- Use canonical identity/project data, not the student-editable review payload.
  if actor=project_row.owner_id then
    recipient := lower(nullif(btrim(project_row.advisor_email),''));
  else
    select lower(nullif(btrim(u.email),'')) into recipient from auth.users u where u.id=project_row.owner_id and u.email_confirmed_at is not null;
  end if;
  if recipient is null or recipient !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    return jsonb_build_object('allowed', false, 'code', 'reminder_recipient_required');
  end if;

  insert into private.advisor_reminder_actors(actor_id) values(actor) on conflict do nothing;
  select * into actor_bucket from private.advisor_reminder_actors where actor_id=actor for update;
  current_time_value := clock_timestamp();
  select coalesce(array_agg(attempt_at order by attempt_at),'{}'::timestamptz[]) into recent_attempts
    from unnest(actor_bucket.attempts_at) attempt_at where attempt_at > current_time_value-interval '24 hours';
  select reserved_at into previous_at from private.advisor_reminder_reservations
    where project_id=p_project_id and actor_id=actor and review_id=p_review_id;
  if previous_at + interval '24 hours' > current_time_value then
    return jsonb_build_object('allowed',false,'code','reminder_cooldown','retry_after',greatest(1,ceil(extract(epoch from previous_at+interval '24 hours'-current_time_value))::integer));
  end if;
  if cardinality(recent_attempts) >= 5 then
    return jsonb_build_object('allowed',false,'code','reminder_limit','retry_after',greatest(1,ceil(extract(epoch from recent_attempts[1]+interval '24 hours'-current_time_value))::integer));
  end if;
  reservation := gen_random_uuid();
  insert into private.advisor_reminder_reservations values(p_project_id,actor,p_review_id,reservation,current_time_value)
    on conflict(project_id,actor_id,review_id) do update set reservation_id=excluded.reservation_id,reserved_at=excluded.reserved_at;
  update private.advisor_reminder_actors set attempts_at=array_append(recent_attempts,current_time_value) where actor_id=actor;
  delete from private.advisor_reminder_reservations where actor_id=actor and reserved_at<current_time_value-interval '7 days';
  return jsonb_build_object('allowed',true,'reservation_id',reservation,'recipient_email',recipient);
end;
$$;
revoke all on function public.reserve_advisor_reminder(uuid,text) from public, anon, authenticated, service_role;
grant execute on function public.reserve_advisor_reminder(uuid,text) to authenticated;
comment on function public.reserve_advisor_reminder(uuid,text) is 'Atomic reminder guard: one attempt/review/actor/24h, five attempts/actor/24h; uncertain sends consume reservation.';
commit;
