-- Fixed test forms made of one or more timed modules (e.g. the combined test
-- runs Reading and Writing, then Math). Attempts now start from a form and
-- move through its modules one at a time.

drop function if exists public.start_attempt(text, public.exam_section, text, text);
drop function if exists public.get_attempt(text, uuid, text);
drop function if exists public.save_progress(text, uuid, text, jsonb, text[], jsonb, jsonb);
drop function if exists public.submit_attempt(text, uuid, text, jsonb, text[], jsonb, jsonb);
drop function if exists public.get_result(text, uuid, text);
drop function if exists public.usage_status(text, text, text);
drop function if exists private.attempt_payload(public.attempts, boolean);
drop function if exists private.pick_questions(public.subject, int);
drop table if exists public.section_settings;

create table public.test_forms (
  id text primary key,
  section public.exam_section not null,
  title text not null,
  description text not null,
  -- [{ "title", "subject", "duration_seconds", "question_ids": [...] }]
  modules jsonb not null check (jsonb_typeof(modules) = 'array' and jsonb_array_length(modules) > 0),
  active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.test_forms enable row level security;
create policy "Active test forms are public"
  on public.test_forms for select
  to anon, authenticated
  using (active);

alter table public.attempts
  add column test_id text not null references public.test_forms (id),
  add column modules jsonb not null default '[]'::jsonb,
  add column module_index int not null default 0;

create index attempts_test_idx on public.attempts (test_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create function private.module_ids(a public.attempts)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_agg(x order by o), '{}')
  from jsonb_array_elements_text(a.modules -> a.module_index -> 'question_ids') with ordinality as t(x, o);
$$;

create function private.module_summary(p_modules jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'title', m ->> 'title',
    'subject', m ->> 'subject',
    'duration_seconds', (m ->> 'duration_seconds')::int,
    'question_count', jsonb_array_length(m -> 'question_ids')
  ) order by o), '[]'::jsonb)
  from jsonb_array_elements(p_modules) with ordinality as t(m, o);
$$;

create function private.attempt_payload(a public.attempts, p_resumed boolean)
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

-- ---------------------------------------------------------------------------
-- Public API
-- ---------------------------------------------------------------------------
create function public.usage_status(p_secret text, p_guest_key text default null, p_ip_hash text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_used int;
  v_limit int := private.daily_limit(v_uid);
begin
  perform private.assert_server(p_secret);
  perform private.finalize_expired(v_uid, p_guest_key);
  v_used := private.attempts_today(v_uid, p_guest_key, p_ip_hash);

  return jsonb_build_object(
    'is_guest', v_uid is null,
    'used', v_used,
    'limit', v_limit,
    'remaining', greatest(v_limit - v_used, 0),
    'resets_at', private.day_start() + interval '1 day',
    'active', coalesce((
      select jsonb_agg(jsonb_build_object(
        'attempt_id', a.id, 'test_id', a.test_id, 'section', a.section, 'deadline', a.deadline))
      from public.attempts a
      where a.status = 'in_progress'
        and a.deadline > now()
        and case
          when v_uid is not null then a.user_id = v_uid
          else a.user_id is null and a.guest_key = p_guest_key
        end
    ), '[]'::jsonb)
  );
end;
$$;

create function public.start_attempt(
  p_secret text,
  p_test_id text,
  p_guest_key text default null,
  p_ip_hash text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  f public.test_forms;
  a public.attempts;
  v_ids text[];
begin
  perform private.assert_server(p_secret);

  if v_uid is null and (p_guest_key is null or char_length(p_guest_key) < 32) then
    raise exception 'GUEST_KEY_REQUIRED' using errcode = '22023';
  end if;

  select * into f from public.test_forms where id = p_test_id and active;
  if not found then
    raise exception 'TEST_NOT_FOUND' using errcode = 'P0002';
  end if;

  -- Serialize starts per identity so parallel requests can't exceed the limit.
  perform pg_advisory_xact_lock(hashtext(coalesce(v_uid::text, p_guest_key)));
  if v_uid is null and p_ip_hash is not null then
    perform pg_advisory_xact_lock(hashtext(p_ip_hash));
  end if;

  perform private.finalize_expired(v_uid, p_guest_key);

  -- Resume an unfinished attempt of the same test instead of starting over.
  select * into a
  from public.attempts x
  where x.status = 'in_progress'
    and x.deadline > now()
    and x.test_id = f.id
    and case
      when v_uid is not null then x.user_id = v_uid
      else x.user_id is null and x.guest_key = p_guest_key
    end
  order by x.started_at desc
  limit 1;

  if found then
    return private.attempt_payload(a, true);
  end if;

  if private.attempts_today(v_uid, p_guest_key, p_ip_hash) >= private.daily_limit(v_uid) then
    raise exception 'DAILY_LIMIT_REACHED' using errcode = 'P0001';
  end if;

  select array_agg(q order by m_ord, q_ord) into v_ids
  from jsonb_array_elements(f.modules) with ordinality as m(module, m_ord),
       jsonb_array_elements_text(m.module -> 'question_ids') with ordinality as t(q, q_ord);

  insert into public.attempts (
    user_id, guest_key, ip_hash, test_id, section, question_ids, modules, module_index, deadline
  )
  values (
    v_uid,
    case when v_uid is null then p_guest_key end,
    case when v_uid is null then p_ip_hash end,
    f.id,
    f.section,
    v_ids,
    f.modules,
    0,
    now() + make_interval(secs => (f.modules -> 0 ->> 'duration_seconds')::int)
  )
  returning * into a;

  return private.attempt_payload(a, false);
end;
$$;

create function public.get_attempt(p_secret text, p_attempt_id uuid, p_guest_key text default null)
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

  if a.status = 'in_progress' and a.deadline + interval '30 seconds' < now() then
    perform private.finalize_attempt(a.id);
    return jsonb_build_object('attempt_id', a.id, 'status', 'completed');
  end if;

  if a.status = 'completed' then
    return jsonb_build_object('attempt_id', a.id, 'status', 'completed');
  end if;

  return private.attempt_payload(a, true);
end;
$$;

-- Saves work for the current module only; earlier modules are locked.
create function public.save_progress(
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

  if a.status = 'in_progress' and now() <= a.deadline + interval '30 seconds' then
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
    'deadline', a.deadline,
    'server_now', now()
  );
end;
$$;

-- Finishes the current module: advances to the next one, or scores the attempt
-- when it was the last module.
create function public.submit_module(
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
     and a.deadline + interval '30 seconds' >= now()
     and a.module_index + 1 < jsonb_array_length(a.modules) then
    update public.attempts set
      module_index = a.module_index + 1,
      deadline = now() + make_interval(secs => (a.modules -> (a.module_index + 1) ->> 'duration_seconds')::int)
    where id = a.id
    returning * into a;
    return private.attempt_payload(a, false);
  end if;

  perform private.finalize_attempt(p_attempt_id);
  return jsonb_build_object('attempt_id', p_attempt_id, 'status', 'completed');
end;
$$;

create function public.get_result(p_secret text, p_attempt_id uuid, p_guest_key text default null)
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

  if a.status = 'in_progress' and a.deadline + interval '30 seconds' < now() then
    perform private.finalize_attempt(a.id);
    a := private.owned_attempt(p_attempt_id, p_guest_key);
  end if;

  if a.status <> 'completed' then
    raise exception 'ATTEMPT_IN_PROGRESS' using errcode = 'P0001';
  end if;

  return jsonb_build_object(
    'attempt_id', a.id,
    'test_id', a.test_id,
    'section', a.section,
    'title', (select f.title from public.test_forms f where f.id = a.test_id),
    'is_guest', a.user_id is null,
    'started_at', a.started_at,
    'submitted_at', a.submitted_at,
    'modules', private.module_summary(a.modules),
    'correct_count', a.correct_count,
    'total_count', a.total_count,
    'score', a.score,
    'english_score', a.english_score,
    'math_score', a.math_score,
    'breakdown', a.breakdown,
    'violations', a.violations,
    'items', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', q.id,
        'number', t.ord,
        'subject', q.subject,
        'domain', q.domain,
        'skill', q.skill,
        'difficulty', q.difficulty,
        'type', q.type,
        'stimulus', q.stimulus,
        'prompt', q.prompt,
        'choices', q.choices,
        'correct_answer', case when q.type = 'mcq' then q.answer ->> 'choice' else q.answer -> 'accepted' ->> 0 end,
        'user_answer', a.answers ->> q.id,
        'is_correct', private.is_correct(q.type, q.answer, a.answers ->> q.id),
        'flagged', q.id = any(a.flagged),
        'time_spent', coalesce((a.time_spent ->> q.id)::int, 0),
        'explanation', q.explanation
      ) order by t.ord), '[]'::jsonb)
      from unnest(a.question_ids) with ordinality as t(id, ord)
      join public.questions q on q.id = t.id
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------
revoke all on all functions in schema private from public, anon, authenticated;

revoke all on function public.usage_status(text, text, text) from public;
revoke all on function public.start_attempt(text, text, text, text) from public;
revoke all on function public.get_attempt(text, uuid, text) from public;
revoke all on function public.save_progress(text, uuid, text, jsonb, text[], jsonb, jsonb) from public;
revoke all on function public.submit_module(text, uuid, text, jsonb, text[], jsonb, jsonb) from public;
revoke all on function public.get_result(text, uuid, text) from public;

grant execute on function public.usage_status(text, text, text) to anon, authenticated;
grant execute on function public.start_attempt(text, text, text, text) to anon, authenticated;
grant execute on function public.get_attempt(text, uuid, text) to anon, authenticated;
grant execute on function public.save_progress(text, uuid, text, jsonb, text[], jsonb, jsonb) to anon, authenticated;
grant execute on function public.submit_module(text, uuid, text, jsonb, text[], jsonb, jsonb) to anon, authenticated;
grant execute on function public.get_result(text, uuid, text) to anon, authenticated;
