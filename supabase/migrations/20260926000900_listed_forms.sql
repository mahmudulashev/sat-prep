-- Only some test forms are shown on the Tests pages; the rest stay available
-- for past results but are not listed.

alter table public.test_forms add column listed boolean not null default true;

-- The first hand-written tests are no longer listed.
update public.test_forms set listed = false where id in ('math-1', 'english-1', 'general-1');

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

  insert into public.test_forms (id, section, title, description, modules, sort, score_table, listed)
  select f.id, f.section, f.title, f.description, f.modules, f.sort, f.score_table, coalesce(f.listed, true)
  from jsonb_to_recordset(p_forms) as f(
    id text, section public.exam_section, title text, description text, modules jsonb, sort int, score_table jsonb, listed boolean
  )
  on conflict (id) do update set
    section = excluded.section,
    title = excluded.title,
    description = excluded.description,
    modules = excluded.modules,
    sort = excluded.sort,
    score_table = excluded.score_table,
    listed = excluded.listed;
  get diagnostics v_forms = row_count;

  return jsonb_build_object('questions', v_questions, 'forms', v_forms);
end;
$$;
