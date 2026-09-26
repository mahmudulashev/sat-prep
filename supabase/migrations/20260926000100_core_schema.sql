-- Core schema: question bank, section settings, profiles and attempts.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.config (
  key text primary key,
  value text not null
);

create type public.exam_section as enum ('math', 'english', 'general');
create type public.subject as enum ('math', 'english');
create type public.difficulty as enum ('easy', 'medium', 'hard');
create type public.question_type as enum ('mcq', 'spr');
create type public.attempt_status as enum ('in_progress', 'completed');

-- ---------------------------------------------------------------------------
-- Question bank. No API role can read this table directly; questions are
-- served (without answers) and graded only through the functions below.
-- ---------------------------------------------------------------------------
create table public.questions (
  id text primary key,
  subject public.subject not null,
  domain text not null,
  skill text not null,
  difficulty public.difficulty not null,
  type public.question_type not null default 'mcq',
  stimulus jsonb not null default '[]'::jsonb,
  prompt text not null,
  choices jsonb,
  answer jsonb not null,
  explanation text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint questions_mcq_choices check (
    type = 'spr' or (jsonb_typeof(choices) = 'array' and jsonb_array_length(choices) = 4)
  )
);

create index questions_subject_domain_idx on public.questions (subject, domain) where active;
alter table public.questions enable row level security;

-- ---------------------------------------------------------------------------
-- Section settings (public, read-only)
-- ---------------------------------------------------------------------------
create table public.section_settings (
  section public.exam_section primary key,
  title text not null,
  english_count int not null default 0 check (english_count >= 0),
  math_count int not null default 0 check (math_count >= 0),
  duration_seconds int not null check (duration_seconds > 0)
);

alter table public.section_settings enable row level security;
create policy "Section settings are public"
  on public.section_settings for select
  to anon, authenticated
  using (true);

insert into public.section_settings (section, title, english_count, math_count, duration_seconds) values
  ('english', 'Reading and Writing', 24, 0, 30 * 60),
  ('math', 'Math', 0, 20, 32 * 60),
  ('general', 'General', 10, 10, 30 * 60);

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (char_length(full_name) <= 80),
  target_score int check (target_score between 400 and 1600),
  test_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Attempts
-- ---------------------------------------------------------------------------
create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  guest_key text,
  ip_hash text,
  section public.exam_section not null,
  question_ids text[] not null,
  answers jsonb not null default '{}'::jsonb,
  flagged text[] not null default '{}',
  time_spent jsonb not null default '{}'::jsonb,
  violations jsonb not null default '[]'::jsonb,
  status public.attempt_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  deadline timestamptz not null,
  submitted_at timestamptz,
  correct_count int,
  total_count int,
  score int,
  english_score int,
  math_score int,
  breakdown jsonb,
  constraint attempts_owner check (user_id is not null or guest_key is not null)
);

create index attempts_user_started_idx on public.attempts (user_id, started_at desc);
create index attempts_guest_started_idx on public.attempts (guest_key, started_at desc) where user_id is null;
create index attempts_ip_started_idx on public.attempts (ip_hash, started_at desc) where user_id is null;

alter table public.attempts enable row level security;

create policy "Users read their own attempts"
  on public.attempts for select
  to authenticated
  using ((select auth.uid()) = user_id);
