-- Optional breaks before a module (the full-length test has a 10-minute break
-- between Reading and Writing and Math). A module's deadline includes its break;
-- the student can end the break early with end_break().

create or replace function private.module_summary(p_modules jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'title', m ->> 'title',
    'subject', m ->> 'subject',
    'duration_seconds', (m ->> 'duration_seconds')::int,
    'break_seconds', coalesce((m ->> 'break_seconds')::int, 0),
    'question_count', jsonb_array_length(m -> 'question_ids')
  ) order by o), '[]'::jsonb)
  from jsonb_array_elements(p_modules) with ordinality as t(m, o);
$$;

create function private.module_duration(a public.attempts)
returns interval
language sql
immutable
set search_path = ''
as $$
  select make_interval(secs => (a.modules -> a.module_index ->> 'duration_seconds')::int);
$$;

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
    'deadline', a.deadline,
    'break_until', case
      when a.deadline - private.module_duration(a) > now() then a.deadline - private.module_duration(a)
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
  perform public.save_progress(p_secret, p_attempt_id, p_guest_key, p_answers, p_flagged, p_time_spent, p_violations);

  select * into a from public.attempts where id = p_attempt_id for update;

  if a.status = 'in_progress'
     and a.deadline + interval '30 seconds' >= now()
     and a.module_index + 1 < jsonb_array_length(a.modules) then
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

create function public.end_break(p_secret text, p_attempt_id uuid, p_guest_key text default null)
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

  if a.status = 'in_progress' and a.deadline - private.module_duration(a) > now() then
    update public.attempts set deadline = now() + private.module_duration(a)
    where id = a.id
    returning * into a;
  end if;

  if a.status <> 'in_progress' then
    return jsonb_build_object('attempt_id', a.id, 'status', a.status);
  end if;
  return private.attempt_payload(a, false);
end;
$$;

revoke all on all functions in schema private from public, anon, authenticated;
revoke all on function public.end_break(text, uuid, text) from public;
grant execute on function public.end_break(text, uuid, text) to anon, authenticated;
