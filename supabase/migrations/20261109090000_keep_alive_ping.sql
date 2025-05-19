-- Lightweight endpoint for the external keep-alive schedule (Dokploy, rpi5-01).
-- A successful query against Postgres so the free-tier project is never paused for inactivity.
-- Returns only the current time; exposes no data.
create function public.ping()
returns timestamptz
language sql
stable
security invoker
set search_path = ''
as $$ select now(); $$;

revoke execute on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated;
