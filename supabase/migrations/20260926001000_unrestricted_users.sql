-- Accounts without a daily test limit (the site owner). The app also skips
-- the test-lockdown warnings for them.

create table private.unrestricted_users (email text primary key);
insert into private.unrestricted_users (email) values ('mahmud@ulashev.com');

create function private.is_unrestricted(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id is not null and exists (
    select 1
    from auth.users u
    join private.unrestricted_users r on r.email = lower(u.email)
    where u.id = p_user_id
  );
$$;

create or replace function private.daily_limit(p_user_id uuid)
returns int
language sql
stable
set search_path = ''
as $$
  select case
    when p_user_id is null then 1
    when private.is_unrestricted(p_user_id) then 100000
    else 3
  end;
$$;

create or replace function public.usage_status(p_secret text, p_guest_key text default null, p_ip_hash text default null)
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
    'unlimited', private.is_unrestricted(v_uid),
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

revoke all on all functions in schema private from public, anon, authenticated;
