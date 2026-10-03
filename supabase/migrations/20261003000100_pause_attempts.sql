-- Pausing the module timer. While an attempt is paused, the time left in the
-- module is kept in `paused_remaining` and the deadline is pushed to infinity,
-- so nothing that checks the deadline (expiry, autosave grace, resumable
-- attempts) treats the module as running out. Resuming sets a fresh deadline.
-- Answers can't be saved or submitted while paused, and the questions are
-- hidden in the client.

alter table public.attempts add column paused_remaining interval;

create or replace function private.attempt_payload(a public.attempts, p_resumed boolean)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'attempt_id', a.id,
    'test_id', a.test_id,
    'section', a.section,
    'title', f.title,
    'status', a.status,
    'started_at', a.started_at,
    -- While paused, report the deadline as if the module were running from now.
    'deadline', coalesce(now() + a.paused_remaining, a.deadline),
    'paused', a.paused_remaining is not null,
    'break_until', case
      when a.paused_remaining is null and a.deadline - private.module_duration(a) > now()
        then a.deadline - private.module_duration(a)
    end,
    'server_now', now(),
    'module_index', a.module_index,
    'modules', private.module_summary(a.modules),
    'answers', a.answers,
    'flagged', to_jsonb(a.flagged),
    'time_spent', a.time_spent,
    'violations', a.violations,
    'resumed', p_resumed,
    'questions', private.attempt_questions(private.module_ids(a))
  )
  from public.test_forms f
  where f.id = a.test_id;
$$;

-- Saves the work so far, then stops the clock. Breaks can't be paused.
create function public.pause_attempt(
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

create function public.resume_attempt(p_secret text, p_attempt_id uuid, p_guest_key text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.attempts;
begin
  perform private.assert_server(p_secret);
  a := private.owned_attempt(p_attempt_id, p_guest_key);

  if a.status = 'in_progress' and a.paused_remaining is not null then
    update public.attempts set
      deadline = now() + a.paused_remaining,
      paused_remaining = null
    where id = a.id
    returning * into a;
  end if;

  if a.status <> 'in_progress' then
    return jsonb_build_object('attempt_id', a.id, 'status', a.status);
  end if;
  return private.attempt_payload(a, false);
end;
$$;

-- Same as before, except nothing is saved while the attempt is paused.
create or replace function public.save_progress(
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
  v_current text[];
  v_scope public.attempts;
begin
  perform private.assert_server(p_secret);
  a := private.owned_attempt(p_attempt_id, p_guest_key);

  if a.status = 'in_progress' and a.paused_remaining is null and now() <= a.deadline + interval '30 seconds' then
    v_current := private.module_ids(a);
    v_scope := a;
    v_scope.question_ids := v_current;

    update public.attempts set
      answers = (a.answers - v_current) || private.clean_answers(v_scope, p_answers),
      flagged = (
        select coalesce(array_agg(distinct f), '{}')
        from (
          select unnest(a.flagged) as f
          except
          select unnest(v_current)
          union
          select f2 from unnest(p_flagged) f2 where f2 = any(v_current)
        ) s
      ),
      time_spent = (a.time_spent - v_current) || private.clean_time(v_scope, p_time_spent),
      violations = private.clean_violations(p_violations)
    where id = a.id;
  end if;

  return jsonb_build_object(
    'status', a.status,
    'deadline', coalesce(now() + a.paused_remaining, a.deadline),
    'paused', a.paused_remaining is not null,
    'server_now', now()
  );
end;
$$;

-- Same as before, except a paused module is resumed (with no time used)
-- before it is submitted.
create or replace function public.submit_module(
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
  v_next jsonb;
begin
  perform public.resume_attempt(p_secret, p_attempt_id, p_guest_key);
  perform public.save_progress(p_secret, p_attempt_id, p_guest_key, p_answers, p_flagged, p_time_spent, p_violations);

  select * into a from public.attempts where id = p_attempt_id for update;

  if a.status = 'in_progress'
     and a.deadline + interval '30 seconds' >= now()
     and a.module_index + 1 < jsonb_array_length(a.modules) then
    perform private.route_module(a.id, a.module_index + 1);
    select * into a from public.attempts where id = p_attempt_id;
    v_next := a.modules -> (a.module_index + 1);
    update public.attempts set
      module_index = a.module_index + 1,
      deadline = now() + make_interval(secs =>
        coalesce((v_next ->> 'break_seconds')::int, 0) + (v_next ->> 'duration_seconds')::int)
    where id = a.id
    returning * into a;
    return private.attempt_payload(a, false);
  end if;

  perform private.finalize_attempt(p_attempt_id);
  return jsonb_build_object('attempt_id', p_attempt_id, 'status', 'completed');
end;
$$;

revoke all on all functions in schema private from public, anon, authenticated;
revoke all on function public.pause_attempt(text, uuid, text, jsonb, text[], jsonb, jsonb) from public;
revoke all on function public.resume_attempt(text, uuid, text) from public;
grant execute on function public.pause_attempt(text, uuid, text, jsonb, text[], jsonb, jsonb) to anon, authenticated;
grant execute on function public.resume_attempt(text, uuid, text) to anon, authenticated;
