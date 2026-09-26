-- Exam engine: daily limits, question selection, autosave and server-side grading.
--
-- Every public function requires the application server secret. Signed-in
-- users are identified by their JWT (auth.uid()); guests by a hashed cookie
-- key and a hashed IP address that only the application server can supply.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create function private.assert_server(p_secret text)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_secret is null
     or encode(extensions.digest(p_secret, 'sha256'), 'hex') is distinct from
        (select c.value from private.config c where c.key = 'server_secret_sha256') then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;
end;
$$;

create function private.day_start()
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select date_trunc('day', now() at time zone 'utc') at time zone 'utc';
$$;

create function private.daily_limit(p_user_id uuid)
returns int
language sql
immutable
set search_path = ''
as $$
  select case when p_user_id is null then 1 else 3 end;
$$;

create function private.attempts_today(p_user_id uuid, p_guest_key text, p_ip_hash text)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int
  from public.attempts a
  where a.started_at >= private.day_start()
    and case
      when p_user_id is not null then a.user_id = p_user_id
      else a.user_id is null
        and (a.guest_key = p_guest_key or (p_ip_hash is not null and a.ip_hash = p_ip_hash))
    end;
$$;

create function private.owned_attempt(p_attempt_id uuid, p_guest_key text)
returns public.attempts
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  a public.attempts;
begin
  select * into a from public.attempts where id = p_attempt_id;
  if not found
     or (a.user_id is not null and a.user_id is distinct from v_uid)
     or (a.user_id is null and (p_guest_key is null or a.guest_key is distinct from p_guest_key)) then
    raise exception 'ATTEMPT_NOT_FOUND' using errcode = 'P0002';
  end if;
  return a;
end;
$$;

create function private.pick_questions(p_subject public.subject, p_count int)
returns text[]
language sql
volatile
security definer
set search_path = ''
as $$
  with ranked as (
    select q.id, q.domain, q.difficulty,
           row_number() over (partition by q.domain order by random()) as rn
    from public.questions q
    where q.active and q.subject = p_subject
  ),
  chosen as (
    select * from ranked order by rn, random() limit greatest(p_count, 0)
  )
  select coalesce(array_agg(c.id order by
    case
      when p_subject = 'english' then
        case c.domain
          when 'Craft and Structure' then 1
          when 'Information and Ideas' then 2
          when 'Standard English Conventions' then 3
          when 'Expression of Ideas' then 4
          else 5
        end
      else
        case c.difficulty when 'easy' then 1 when 'medium' then 2 else 3 end
    end,
    random()), '{}')
  from chosen c;
$$;

create function private.attempt_questions(p_ids text[])
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', q.id,
    'subject', q.subject,
    'domain', q.domain,
    'type', q.type,
    'stimulus', q.stimulus,
    'prompt', q.prompt,
    'choices', q.choices
  ) order by t.ord), '[]'::jsonb)
  from unnest(p_ids) with ordinality as t(id, ord)
  join public.questions q on q.id = t.id;
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
    'section', a.section,
    'title', s.title,
    'status', a.status,
    'started_at', a.started_at,
    'deadline', a.deadline,
    'server_now', now(),
    'answers', a.answers,
    'flagged', to_jsonb(a.flagged),
    'time_spent', a.time_spent,
    'violations', a.violations,
    'resumed', p_resumed,
    'questions', private.attempt_questions(a.question_ids)
  )
  from public.section_settings s
  where s.section = a.section;
$$;

-- Student-produced response grading, following the digital SAT entry rules:
-- equivalent fractions are accepted, and a decimal that doesn't fit must fill
-- the answer space (5 characters, 6 with a negative sign).
create function private.spr_is_correct(p_input text, p_answer jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_in text := regexp_replace(coalesce(p_input, ''), '\s', '', 'g');
  v_neg boolean;
  v_body text;
  v_target numeric;
  v_value numeric;
  v_places int;
begin
  if v_in = '' then
    return false;
  end if;
  if left(v_in, 1) = '+' then
    v_in := substr(v_in, 2);
  end if;
  if coalesce(p_answer -> 'accepted', '[]'::jsonb) ? v_in then
    return true;
  end if;
  if p_answer ->> 'value' is null then
    return false;
  end if;

  v_target := (p_answer ->> 'value')::numeric;
  v_neg := left(v_in, 1) = '-';
  v_body := ltrim(v_in, '-');

  if v_body ~ '^\d+/\d+$' then
    if split_part(v_body, '/', 2)::numeric = 0 then
      return false;
    end if;
    v_value := split_part(v_body, '/', 1)::numeric / split_part(v_body, '/', 2)::numeric;
    if v_neg then v_value := -v_value; end if;
    return abs(v_value - v_target) < 0.000001;
  end if;

  if v_body ~ '^(\d+\.?\d*|\.\d+)$' then
    v_value := v_body::numeric;
    if v_neg then v_value := -v_value; end if;
    if abs(v_value - v_target) < 0.000001 then
      return true;
    end if;
    if length(v_body) >= 5 and position('.' in v_body) > 0 then
      v_places := length(split_part(v_body, '.', 2));
      return v_value = trunc(v_target, v_places) or v_value = round(v_target, v_places);
    end if;
  end if;

  return false;
end;
$$;

create function private.is_correct(p_type public.question_type, p_answer jsonb, p_input text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when p_input is null then false
    when p_type = 'mcq' then p_input = (p_answer ->> 'choice')
    else private.spr_is_correct(p_input, p_answer)
  end;
$$;

create function private.scale(p_earned numeric, p_possible numeric)
returns int
language sql
immutable
set search_path = ''
as $$
  select case
    when p_possible > 0 then (round((200 + 600 * p_earned / p_possible) / 10) * 10)::int
  end;
$$;

create function private.finalize_attempt(p_attempt_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.attempts;
  q record;
  v_ok boolean;
  v_weight numeric;
  v_correct int := 0;
  v_total int := 0;
  v_eng_possible numeric := 0;
  v_eng_earned numeric := 0;
  v_math_possible numeric := 0;
  v_math_earned numeric := 0;
  v_breakdown jsonb := '{}'::jsonb;
  v_eng int;
  v_math int;
begin
  select * into a from public.attempts where id = p_attempt_id for update;
  if not found or a.status = 'completed' then
    return;
  end if;

  for q in
    select qq.*
    from unnest(a.question_ids) as t(id)
    join public.questions qq on qq.id = t.id
  loop
    v_ok := private.is_correct(q.type, q.answer, a.answers ->> q.id);
    v_weight := case q.difficulty when 'easy' then 1 when 'medium' then 1.5 else 2 end;
    v_total := v_total + 1;

    if v_ok then
      v_correct := v_correct + 1;
    end if;

    if q.subject = 'english' then
      v_eng_possible := v_eng_possible + v_weight;
      if v_ok then v_eng_earned := v_eng_earned + v_weight; end if;
    else
      v_math_possible := v_math_possible + v_weight;
      if v_ok then v_math_earned := v_math_earned + v_weight; end if;
    end if;

    v_breakdown := jsonb_set(v_breakdown, array[q.domain], jsonb_build_object(
      'subject', q.subject,
      'correct', coalesce((v_breakdown -> q.domain ->> 'correct')::int, 0) + (case when v_ok then 1 else 0 end),
      'total', coalesce((v_breakdown -> q.domain ->> 'total')::int, 0) + 1
    ));
  end loop;

  v_eng := private.scale(v_eng_earned, v_eng_possible);
  v_math := private.scale(v_math_earned, v_math_possible);

  update public.attempts set
    status = 'completed',
    submitted_at = now(),
    correct_count = v_correct,
    total_count = v_total,
    english_score = v_eng,
    math_score = v_math,
    score = coalesce(v_eng, 0) + coalesce(v_math, 0),
    breakdown = v_breakdown
  where id = a.id;
end;
$$;

-- Finish any in-progress attempts whose time (plus a short grace period) is up.
create function private.finalize_expired(p_user_id uuid, p_guest_key text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  for v_id in
    select a.id from public.attempts a
    where a.status = 'in_progress'
      and a.deadline + interval '30 seconds' < now()
      and case
        when p_user_id is not null then a.user_id = p_user_id
        else a.user_id is null and a.guest_key = p_guest_key
      end
  loop
    perform private.finalize_attempt(v_id);
  end loop;
end;
$$;

create function private.clean_answers(a public.attempts, p_answers jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb)
  from jsonb_each_text(case when jsonb_typeof(p_answers) = 'object' then p_answers else '{}'::jsonb end) e
  where e.key = any(a.question_ids) and char_length(e.value) between 1 and 12;
$$;

create function private.clean_time(a public.attempts, p_time jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select coalesce(jsonb_object_agg(e.key, least(greatest(e.value::numeric, 0), 36000)::int), '{}'::jsonb)
  from jsonb_each(case when jsonb_typeof(p_time) = 'object' then p_time else '{}'::jsonb end) e
  where e.key = any(a.question_ids) and jsonb_typeof(e.value) = 'number';
$$;

create function private.clean_violations(p_violations jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select coalesce(jsonb_agg(v order by o), '[]'::jsonb)
  from jsonb_array_elements(case when jsonb_typeof(p_violations) = 'array' then p_violations else '[]'::jsonb end)
       with ordinality as t(v, o)
  where o <= 200 and jsonb_typeof(v) = 'object';
$$;

-- ---------------------------------------------------------------------------
-- Public API (called only by the application server)
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
      select jsonb_agg(jsonb_build_object('attempt_id', a.id, 'section', a.section, 'deadline', a.deadline))
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
  p_section public.exam_section,
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
  s public.section_settings;
  a public.attempts;
  v_ids text[];
begin
  perform private.assert_server(p_secret);

  if v_uid is null and (p_guest_key is null or char_length(p_guest_key) < 32) then
    raise exception 'GUEST_KEY_REQUIRED' using errcode = '22023';
  end if;

  -- Serialize starts per identity so parallel requests can't exceed the limit.
  perform pg_advisory_xact_lock(hashtext(coalesce(v_uid::text, p_guest_key)));
  if v_uid is null and p_ip_hash is not null then
    perform pg_advisory_xact_lock(hashtext(p_ip_hash));
  end if;

  perform private.finalize_expired(v_uid, p_guest_key);

  select * into a
  from public.attempts x
  where x.status = 'in_progress'
    and x.deadline > now()
    and x.section = p_section
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

  select * into s from public.section_settings where section = p_section;
  v_ids := private.pick_questions('english', s.english_count)
        || private.pick_questions('math', s.math_count);

  if coalesce(array_length(v_ids, 1), 0) = 0 then
    raise exception 'NO_QUESTIONS' using errcode = 'P0001';
  end if;

  insert into public.attempts (user_id, guest_key, ip_hash, section, question_ids, deadline)
  values (
    v_uid,
    case when v_uid is null then p_guest_key end,
    case when v_uid is null then p_ip_hash end,
    p_section,
    v_ids,
    now() + make_interval(secs => s.duration_seconds)
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
begin
  perform private.assert_server(p_secret);
  a := private.owned_attempt(p_attempt_id, p_guest_key);

  if a.status = 'in_progress' and now() <= a.deadline + interval '30 seconds' then
    update public.attempts set
      answers = private.clean_answers(a, p_answers),
      flagged = (select coalesce(array_agg(f), '{}') from unnest(p_flagged) f where f = any(a.question_ids)),
      time_spent = private.clean_time(a, p_time_spent),
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

create function public.submit_attempt(
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
begin
  perform public.save_progress(p_secret, p_attempt_id, p_guest_key, p_answers, p_flagged, p_time_spent, p_violations);
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
    'section', a.section,
    'title', (select s.title from public.section_settings s where s.section = a.section),
    'is_guest', a.user_id is null,
    'started_at', a.started_at,
    'submitted_at', a.submitted_at,
    'duration_seconds', extract(epoch from (a.deadline - a.started_at))::int,
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
revoke all on function public.start_attempt(text, public.exam_section, text, text) from public;
revoke all on function public.get_attempt(text, uuid, text) from public;
revoke all on function public.save_progress(text, uuid, text, jsonb, text[], jsonb, jsonb) from public;
revoke all on function public.submit_attempt(text, uuid, text, jsonb, text[], jsonb, jsonb) from public;
revoke all on function public.get_result(text, uuid, text) from public;

grant execute on function public.usage_status(text, text, text) to anon, authenticated;
grant execute on function public.start_attempt(text, public.exam_section, text, text) to anon, authenticated;
grant execute on function public.get_attempt(text, uuid, text) to anon, authenticated;
grant execute on function public.save_progress(text, uuid, text, jsonb, text[], jsonb, jsonb) to anon, authenticated;
grant execute on function public.submit_attempt(text, uuid, text, jsonb, text[], jsonb, jsonb) to anon, authenticated;
grant execute on function public.get_result(text, uuid, text) to anon, authenticated;
