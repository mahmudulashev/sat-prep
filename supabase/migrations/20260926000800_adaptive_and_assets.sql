-- Adaptive Module 2, question images, official score tables and SPR items
-- with more than one correct value.

-- ---------------------------------------------------------------------------
-- Question images
-- ---------------------------------------------------------------------------
create table public.assets (
  id text primary key,
  mime text not null default 'image/png',
  width int not null,
  height int not null,
  data bytea not null,
  created_at timestamptz not null default now()
);

alter table public.assets enable row level security;
comment on table public.assets is
  'Question images. RLS enabled with no policies: served through the secret-gated get_asset().';

create function public.get_asset(p_secret text, p_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.assert_server(p_secret);
  return (
    select jsonb_build_object('mime', a.mime, 'data', encode(a.data, 'base64'))
    from public.assets a
    where a.id = p_id
  );
end;
$$;

create function public.asset_ids(p_secret text)
returns text[]
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.assert_server(p_secret);
  return coalesce((select array_agg(id) from public.assets), '{}');
end;
$$;

create function public.seed_assets(p_secret text, p_assets jsonb)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  perform private.assert_server(p_secret);
  insert into public.assets (id, mime, width, height, data)
  select x.id, coalesce(x.mime, 'image/png'), x.width, x.height, decode(x.data, 'base64')
  from jsonb_to_recordset(p_assets) as x(id text, mime text, width int, height int, data text)
  on conflict (id) do nothing;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Test forms: official raw-to-scaled score tables
-- ---------------------------------------------------------------------------
-- { "english": [[lower, upper] per raw score], "math": [...] }
alter table public.test_forms add column score_table jsonb;

create or replace function public.seed_content(p_secret text, p_questions jsonb, p_forms jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_questions int;
  v_forms int;
begin
  perform private.assert_server(p_secret);

  insert into public.questions (id, subject, domain, skill, difficulty, type, stimulus, prompt, choices, answer, explanation)
  select q.id, q.subject, q.domain, q.skill, q.difficulty, q.type,
         coalesce(q.stimulus, '[]'::jsonb), q.prompt, q.choices, q.answer, coalesce(q.explanation, '')
  from jsonb_to_recordset(p_questions) as q(
    id text, subject public.subject, domain text, skill text, difficulty public.difficulty,
    type public.question_type, stimulus jsonb, prompt text, choices jsonb, answer jsonb, explanation text
  )
  on conflict (id) do update set
    subject = excluded.subject,
    domain = excluded.domain,
    skill = excluded.skill,
    difficulty = excluded.difficulty,
    type = excluded.type,
    stimulus = excluded.stimulus,
    prompt = excluded.prompt,
    choices = excluded.choices,
    answer = excluded.answer,
    explanation = excluded.explanation;
  get diagnostics v_questions = row_count;

  insert into public.test_forms (id, section, title, description, modules, sort, score_table)
  select f.id, f.section, f.title, f.description, f.modules, f.sort, f.score_table
  from jsonb_to_recordset(p_forms) as f(
    id text, section public.exam_section, title text, description text, modules jsonb, sort int, score_table jsonb
  )
  on conflict (id) do update set
    section = excluded.section,
    title = excluded.title,
    description = excluded.description,
    modules = excluded.modules,
    sort = excluded.sort,
    score_table = excluded.score_table;
  get diagnostics v_forms = row_count;

  return jsonb_build_object('questions', v_questions, 'forms', v_forms);
end;
$$;

-- ---------------------------------------------------------------------------
-- SPR answers can list several distinct correct values (e.g. both roots).
-- ---------------------------------------------------------------------------
create or replace function private.spr_is_correct(p_input text, p_answer jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_in text := regexp_replace(coalesce(p_input, ''), '\s', '', 'g');
  v_neg boolean;
  v_body text;
  v_value numeric;
  v_places int;
  v_target numeric;
  v_targets numeric[];
begin
  if v_in = '' then
    return false;
  end if;
  if left(v_in, 1) = '+' then
    v_in := substr(v_in, 2);
  end if;
  v_in := replace(v_in, '−', '-');
  if coalesce(p_answer -> 'accepted', '[]'::jsonb) ? v_in then
    return true;
  end if;

  select coalesce(array_agg(v::numeric), '{}') into v_targets
  from jsonb_array_elements_text(coalesce(p_answer -> 'values', '[]'::jsonb)) as t(v);
  if p_answer ->> 'value' is not null then
    v_targets := v_targets || (p_answer ->> 'value')::numeric;
  end if;
  if cardinality(v_targets) = 0 then
    return false;
  end if;

  v_neg := left(v_in, 1) = '-';
  v_body := ltrim(v_in, '-');

  if v_body ~ '^\d+/\d+$' then
    if split_part(v_body, '/', 2)::numeric = 0 then
      return false;
    end if;
    v_value := split_part(v_body, '/', 1)::numeric / split_part(v_body, '/', 2)::numeric;
    if v_neg then v_value := -v_value; end if;
    foreach v_target in array v_targets loop
      if abs(v_value - v_target) < 0.000001 then
        return true;
      end if;
    end loop;
    return false;
  end if;

  if v_body ~ '^(\d+\.?\d*|\.\d+)$' then
    v_value := v_body::numeric;
    if v_neg then v_value := -v_value; end if;
    foreach v_target in array v_targets loop
      if abs(v_value - v_target) < 0.000001 then
        return true;
      end if;
      -- A decimal that fills the answer space may truncate or round.
      if length(v_body) >= 5 and position('.' in v_body) > 0 then
        v_places := length(split_part(v_body, '.', 2));
        if v_value = trunc(v_target, v_places) or v_value = round(v_target, v_places) then
          return true;
        end if;
      end if;
    end loop;
  end if;

  return false;
end;
$$;

-- ---------------------------------------------------------------------------
-- Adaptive modules
-- ---------------------------------------------------------------------------
-- A module may carry { "adaptive": { "from": 0, "threshold": 0.6,
-- "lower": [...ids], "upper": [...ids] } } and starts with no question_ids.
-- When the student reaches it, the share of correct answers in module `from`
-- picks the lower (easier) or upper (harder) version; the choice is stored as
-- "route" and the module's question_ids are filled in.

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
    'question_count', case
      when m ? 'adaptive' and jsonb_array_length(m -> 'question_ids') = 0
        then jsonb_array_length(m -> 'adaptive' -> 'lower')
      else jsonb_array_length(m -> 'question_ids')
    end,
    'adaptive', m ? 'adaptive',
    'route', m ->> 'route'
  ) order by o), '[]'::jsonb)
  from jsonb_array_elements(p_modules) with ordinality as t(m, o);
$$;

create function private.route_module(p_attempt_id uuid, p_index int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.attempts;
  m jsonb;
  v_from int;
  v_correct int;
  v_total int;
  v_route text;
  v_all text[];
begin
  select * into a from public.attempts where id = p_attempt_id for update;
  m := a.modules -> p_index;
  if m is null or not (m ? 'adaptive') or coalesce(m ->> 'route', '') <> '' then
    return;
  end if;

  v_from := coalesce((m -> 'adaptive' ->> 'from')::int, p_index - 1);
  select count(*) filter (where private.is_correct(q.type, q.answer, a.answers ->> q.id)), count(*)
  into v_correct, v_total
  from jsonb_array_elements_text(a.modules -> v_from -> 'question_ids') as t(id)
  join public.questions q on q.id = t.id;

  v_route := case
    when v_total > 0 and v_correct::numeric / v_total >= coalesce((m -> 'adaptive' ->> 'threshold')::numeric, 0.6)
      then 'upper'
    else 'lower'
  end;

  m := m || jsonb_build_object('route', v_route, 'question_ids', m -> 'adaptive' -> v_route);
  a.modules := jsonb_set(a.modules, array[p_index::text], m);

  select coalesce(array_agg(x order by mo, xo), '{}') into v_all
  from jsonb_array_elements(a.modules) with ordinality as mm(module, mo),
       jsonb_array_elements_text(mm.module -> 'question_ids') with ordinality as t(x, xo);

  update public.attempts set modules = a.modules, question_ids = v_all where id = a.id;
end;
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

-- ---------------------------------------------------------------------------
-- Scoring
-- ---------------------------------------------------------------------------
-- Official tests use their raw-to-scaled table (midpoint of the range).
-- Adaptive sections taken on the easier route top out at 640; otherwise the
-- difficulty-weighted share of points is scaled to 200-800.
create function private.section_score(p_table jsonb, p_raw int, p_earned numeric, p_possible numeric, p_route text)
returns int
language sql
immutable
set search_path = ''
as $$
  select case
    when p_possible is null or p_possible = 0 then null
    when p_table is not null and jsonb_array_length(p_table) > p_raw then
      (round((((p_table -> p_raw ->> 0)::numeric + (p_table -> p_raw ->> 1)::numeric) / 2) / 10) * 10)::int
    when p_route = 'lower' then
      (round((200 + 440 * p_earned / p_possible) / 10) * 10)::int
    else private.scale(p_earned, p_possible)
  end;
$$;

create or replace function private.finalize_attempt(p_attempt_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.attempts;
  f public.test_forms;
  q record;
  i int;
  v_ok boolean;
  v_weight numeric;
  v_correct int := 0;
  v_total int := 0;
  v_eng_raw int := 0;
  v_math_raw int := 0;
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

  -- Adaptive modules never reached (time ran out) still count, on the route
  -- the answers so far point to.
  for i in 0 .. jsonb_array_length(a.modules) - 1 loop
    perform private.route_module(a.id, i);
  end loop;
  select * into a from public.attempts where id = p_attempt_id;
  select * into f from public.test_forms where id = a.test_id;

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
      if v_ok then
        v_eng_earned := v_eng_earned + v_weight;
        v_eng_raw := v_eng_raw + 1;
      end if;
    else
      v_math_possible := v_math_possible + v_weight;
      if v_ok then
        v_math_earned := v_math_earned + v_weight;
        v_math_raw := v_math_raw + 1;
      end if;
    end if;

    v_breakdown := jsonb_set(v_breakdown, array[q.domain], jsonb_build_object(
      'subject', q.subject,
      'correct', coalesce((v_breakdown -> q.domain ->> 'correct')::int, 0) + (case when v_ok then 1 else 0 end),
      'total', coalesce((v_breakdown -> q.domain ->> 'total')::int, 0) + 1
    ));
  end loop;

  v_eng := private.section_score(
    f.score_table -> 'english', v_eng_raw, v_eng_earned, v_eng_possible,
    (select m ->> 'route' from jsonb_array_elements(a.modules) m where m ->> 'subject' = 'english' and m ? 'route' limit 1)
  );
  v_math := private.section_score(
    f.score_table -> 'math', v_math_raw, v_math_earned, v_math_possible,
    (select m ->> 'route' from jsonb_array_elements(a.modules) m where m ->> 'subject' = 'math' and m ? 'route' limit 1)
  );

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

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------
revoke all on all functions in schema private from public, anon, authenticated;

revoke all on function public.get_asset(text, text) from public;
revoke all on function public.asset_ids(text) from public;
revoke all on function public.seed_assets(text, jsonb) from public;
grant execute on function public.get_asset(text, text) to anon, authenticated;
grant execute on function public.asset_ids(text) to anon;
grant execute on function public.seed_assets(text, jsonb) to anon;
revoke execute on function public.seed_content(text, jsonb, jsonb) from authenticated;
