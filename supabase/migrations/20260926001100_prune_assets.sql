-- Lets the upload script remove images no longer used by any question.
create function public.prune_assets(p_secret text, p_keep text[])
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  perform private.assert_server(p_secret);
  if cardinality(p_keep) = 0 then
    return 0;
  end if;
  delete from public.assets where id <> all(p_keep);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.prune_assets(text, text[]) from public, authenticated;
grant execute on function public.prune_assets(text, text[]) to anon;
