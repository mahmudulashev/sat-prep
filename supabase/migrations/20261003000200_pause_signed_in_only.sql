-- Only signed-in students can pause; guest attempts keep running.
create or replace function public.pause_attempt(
  p_secret text,
  p_attempt_id uuid,
  p_guest_key text default null,
  p_answers jsonb default '{}'::jsonb,
  p_flagged text[] default '{}',
  p_time_spent jsonb default '{}'::jsonb,
  p_violations jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.attempts;
begin
  perform public.save_progress(p_secret, p_attempt_id, p_guest_key, p_answers, p_flagged, p_time_spent, p_violations);

  select * into a from public.attempts where id = p_attempt_id for update;

  if a.status = 'in_progress'
     and a.user_id is not null
     and a.paused_remaining is null
     and a.deadline > now()
     and a.deadline - private.module_duration(a) <= now() then
    update public.attempts set
      paused_remaining = a.deadline - now(),
      deadline = 'infinity'
    where id = a.id
    returning * into a;
  end if;

  if a.status <> 'in_progress' then
    return jsonb_build_object('attempt_id', a.id, 'status', a.status);
  end if;
  return private.attempt_payload(a, false);
end;
$$;
