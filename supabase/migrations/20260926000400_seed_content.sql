-- Lets the content script (npm run seed) upsert questions and test forms.
-- Protected by the same server secret as the exam API.

create function public.seed_content(p_secret text, p_questions jsonb, p_forms jsonb)
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
         coalesce(q.stimulus, '[]'::jsonb), q.prompt, q.choices, q.answer, q.explanation
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

  insert into public.test_forms (id, section, title, description, modules, sort)
  select f.id, f.section, f.title, f.description, f.modules, f.sort
  from jsonb_to_recordset(p_forms) as f(
    id text, section public.exam_section, title text, description text, modules jsonb, sort int
  )
  on conflict (id) do update set
    section = excluded.section,
    title = excluded.title,
    description = excluded.description,
    modules = excluded.modules,
    sort = excluded.sort;
  get diagnostics v_forms = row_count;

  return jsonb_build_object('questions', v_questions, 'forms', v_forms);
end;
$$;

revoke all on function public.seed_content(text, jsonb, jsonb) from public;
grant execute on function public.seed_content(text, jsonb, jsonb) to anon;
