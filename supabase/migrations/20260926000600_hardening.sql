-- Tighten grants and remove an index that is no longer used.
--
-- Note for the database linter: the SECURITY DEFINER functions in `public`
-- are intentionally callable through the API. Each one first calls
-- private.assert_server(), so only the application server (which holds the
-- secret) can use them. `public.questions` deliberately has RLS with no
-- policies so answer keys can never be read directly.

-- Supabase's default privileges also grant EXECUTE to `authenticated`.
revoke execute on function public.seed_content(text, jsonb, jsonb) from authenticated;

-- Questions are now selected through fixed test forms.
drop index if exists public.questions_subject_domain_idx;

comment on table public.questions is
  'Question bank. RLS enabled with no policies: read only through secret-gated functions.';
