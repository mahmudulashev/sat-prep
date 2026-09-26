-- Let students remove results from their history.
--
-- Results are hidden rather than erased so they still count toward the daily
-- test limit (otherwise deleting a result would hand back a test).

alter table public.attempts add column deleted_at timestamptz;

create index attempts_user_visible_idx on public.attempts (user_id, started_at desc) where deleted_at is null;

drop policy "Users read their own attempts" on public.attempts;
create policy "Users read their own attempts"
  on public.attempts for select
  to authenticated
  using ((select auth.uid()) = user_id and deleted_at is null);

-- Hidden attempts behave as if they don't exist for every read path.
create or replace function private.owned_attempt(p_attempt_id uuid, p_guest_key text)
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
  select * into a from public.attempts where id = p_attempt_id and deleted_at is null;
  if not found
     or (a.user_id is not null and a.user_id is distinct from v_uid)
     or (a.user_id is null and (p_guest_key is null or a.guest_key is distinct from p_guest_key)) then
    raise exception 'ATTEMPT_NOT_FOUND' using errcode = 'P0002';
  end if;
  return a;
end;
$$;

create function public.delete_attempt(p_attempt_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  update public.attempts
  set deleted_at = now()
  where id = p_attempt_id
    and user_id = v_uid
    and status = 'completed'
    and deleted_at is null;

  return found;
end;
$$;

revoke all on function public.delete_attempt(uuid) from public, anon;
grant execute on function public.delete_attempt(uuid) to authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
