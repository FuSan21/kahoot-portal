-- Question timers run on the database clock: the start time is always stamped by the server,
-- and clients read server_now() to correct for local clock skew.
create function private.stamp_question_start()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.current_question_start_time is not null
     and (old.current_question_start_time is null
          or new.current_question_sequence <> old.current_question_sequence) then
    new.current_question_start_time := now();
  end if;
  return new;
end;
$$;

create trigger stamp_question_start
  before update on public.games
  for each row execute function private.stamp_question_start();

create function public.server_now()
returns timestamptz
language sql
stable
set search_path = ''
as $$ select now(); $$;

revoke execute on function public.server_now() from public, anon;
grant execute on function public.server_now() to authenticated;
