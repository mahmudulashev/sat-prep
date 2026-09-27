-- Guests get 2 tests a day and signed-in students 4.
create or replace function private.daily_limit(p_user_id uuid)
returns int
language sql
stable
set search_path = ''
as $$
  select case
    when p_user_id is null then 2
    when private.is_unrestricted(p_user_id) then 100000
    else 4
  end;
$$;
