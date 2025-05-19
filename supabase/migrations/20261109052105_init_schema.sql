-- Kahoot Portal schema (consolidated).
-- Security model:
--   * choices.is_correct is never selectable by clients; correctness is exposed
--     through get_correct_choice() only once the answer is revealed.
--   * answers are scored server side (speed based) and only inside the open window.
--   * aggregate views are replaced by functions that check the caller's role.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Quizzes
-- ---------------------------------------------------------------------------
create table public.quiz_sets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles (id) on delete cascade,
  is_public boolean not null default true,
  name text not null check (char_length(name) between 1 and 120),
  description text,
  image text,
  social_share_link text,
  social_bonus_points smallint not null default 0 check (social_bonus_points >= 0)
);
create index quiz_sets_created_by_idx on public.quiz_sets (created_by);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  quiz_set_id uuid not null references public.quiz_sets (id) on delete cascade,
  body text not null,
  image text,
  "order" smallint not null,
  time_limit smallint not null default 20 check (time_limit between 5 and 120),
  unique (quiz_set_id, "order")
);

create table public.choices (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  question_id uuid not null references public.questions (id) on delete cascade,
  body text not null,
  position smallint not null default 0,
  is_correct boolean not null default false
);
create index choices_question_id_idx on public.choices (question_id);

-- ---------------------------------------------------------------------------
-- Games
-- ---------------------------------------------------------------------------
create function public.generate_game_code()
returns text
language plpgsql
set search_path = ''
as $$
declare
  candidate text;
begin
  loop
    candidate := lpad((floor(random() * 1000000))::int::text, 6, '0');
    exit when not exists (
      select 1 from public.games g where g.code = candidate and g.phase <> 'result'
    );
  end loop;
  return candidate;
end;
$$;

create table public.games (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  quiz_set_id uuid not null references public.quiz_sets (id) on delete cascade,
  host_user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  code text not null,
  phase text not null default 'lobby' check (phase in ('lobby', 'quiz', 'result')),
  current_question_sequence smallint not null default 0,
  current_question_start_time timestamptz,
  is_answer_revealed boolean not null default false
);
alter table public.games alter column code set default public.generate_game_code();
create unique index games_live_code_idx on public.games (code) where phase <> 'result';
create index games_code_idx on public.games (code);
create index games_quiz_set_id_idx on public.games (quiz_set_id);
create index games_host_user_id_idx on public.games (host_user_id);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  game_id uuid not null references public.games (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 40),
  unique (game_id, user_id)
);
create index participants_user_id_idx on public.participants (user_id);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  participant_id uuid not null references public.participants (id) on delete cascade,
  game_id uuid not null references public.games (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  choice_id uuid not null references public.choices (id) on delete cascade,
  is_correct boolean not null default false,
  response_ms integer not null default 0,
  score integer not null default 0,
  unique (participant_id, question_id)
);
create index answers_game_question_idx on public.answers (game_id, question_id);
create index answers_question_id_idx on public.answers (question_id);
create index answers_choice_id_idx on public.answers (choice_id);

create table public.social_bonus_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  participant_id uuid not null unique references public.participants (id) on delete cascade,
  screenshot_paths text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected'))
);

-- ---------------------------------------------------------------------------
-- Helper predicates (security definer so policies don't recurse through RLS)
-- ---------------------------------------------------------------------------
create schema if not exists private;
grant usage on schema private to authenticated;

create function private.is_game_host(_game_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.games g
    where g.id = _game_id and g.host_user_id = (select auth.uid())
  );
$$;

create function private.is_game_member(_game_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.games g
    where g.id = _game_id and g.host_user_id = (select auth.uid())
  ) or exists (
    select 1 from public.participants p
    where p.game_id = _game_id and p.user_id = (select auth.uid())
  );
$$;

create function private.can_read_quiz(_quiz_set_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.quiz_sets q
    where q.id = _quiz_set_id
      and (q.is_public or q.created_by = (select auth.uid()))
  ) or exists (
    select 1 from public.games g
    where g.quiz_set_id = _quiz_set_id
      and private.is_game_member(g.id)
  );
$$;

create function private.owns_quiz(_quiz_set_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.quiz_sets q
    where q.id = _quiz_set_id and q.created_by = (select auth.uid())
  );
$$;

revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.quiz_sets enable row level security;
alter table public.questions enable row level security;
alter table public.choices enable row level security;
alter table public.games enable row level security;
alter table public.participants enable row level security;
alter table public.answers enable row level security;
alter table public.social_bonus_submissions enable row level security;

-- profiles
create policy "profiles readable by signed in users" on public.profiles
  for select to authenticated using (true);
create policy "users update own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- quiz_sets
create policy "quiz readable when public, owned or in a joined game" on public.quiz_sets
  for select to authenticated using (private.can_read_quiz(id));
create policy "owner inserts quiz" on public.quiz_sets
  for insert to authenticated with check ((select auth.uid()) = created_by);
create policy "owner updates quiz" on public.quiz_sets
  for update to authenticated
  using ((select auth.uid()) = created_by) with check ((select auth.uid()) = created_by);
create policy "owner deletes quiz" on public.quiz_sets
  for delete to authenticated using ((select auth.uid()) = created_by);

-- questions
create policy "questions readable with quiz" on public.questions
  for select to authenticated using (private.can_read_quiz(quiz_set_id));
create policy "owner writes questions" on public.questions
  for all to authenticated
  using (private.owns_quiz(quiz_set_id)) with check (private.owns_quiz(quiz_set_id));

-- choices (is_correct column is not granted for select, see grants below)
create policy "choices readable with quiz" on public.choices
  for select to authenticated using (
    exists (select 1 from public.questions q where q.id = question_id and private.can_read_quiz(q.quiz_set_id))
  );
create policy "owner writes choices" on public.choices
  for all to authenticated
  using (exists (select 1 from public.questions q where q.id = question_id and private.owns_quiz(q.quiz_set_id)))
  with check (exists (select 1 from public.questions q where q.id = question_id and private.owns_quiz(q.quiz_set_id)));

-- games
create policy "games readable by signed in users" on public.games
  for select to authenticated using (true);
create policy "host creates game" on public.games
  for insert to authenticated with check (
    (select auth.uid()) = host_user_id and private.can_read_quiz(quiz_set_id)
  );
create policy "host updates game" on public.games
  for update to authenticated
  using ((select auth.uid()) = host_user_id) with check ((select auth.uid()) = host_user_id);
create policy "host deletes game" on public.games
  for delete to authenticated using ((select auth.uid()) = host_user_id);

-- participants
create policy "participants readable by signed in users" on public.participants
  for select to authenticated using (true);
create policy "user joins lobby as self" on public.participants
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.games g where g.id = game_id and g.phase = 'lobby')
  );
create policy "user renames self" on public.participants
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user leaves or host removes" on public.participants
  for delete to authenticated using (
    (select auth.uid()) = user_id or private.is_game_host(game_id)
  );

-- answers: insert own; see own, host sees all for the game
create policy "player submits own answer" on public.answers
  for insert to authenticated with check (
    exists (select 1 from public.participants p where p.id = participant_id and p.user_id = (select auth.uid()))
  );
create policy "player reads own answers, host reads game answers" on public.answers
  for select to authenticated using (
    exists (select 1 from public.participants p where p.id = participant_id and p.user_id = (select auth.uid()))
    or private.is_game_host(game_id)
  );

-- social bonus
create policy "player and host read submission" on public.social_bonus_submissions
  for select to authenticated using (
    exists (
      select 1 from public.participants p
      where p.id = participant_id
        and (p.user_id = (select auth.uid()) or private.is_game_host(p.game_id))
    )
  );
create policy "player submits own" on public.social_bonus_submissions
  for insert to authenticated with check (
    status = 'pending'
    and exists (select 1 from public.participants p where p.id = participant_id and p.user_id = (select auth.uid()))
  );
create policy "player resubmits after rejection" on public.social_bonus_submissions
  for update to authenticated
  using (
    status = 'rejected'
    and exists (select 1 from public.participants p where p.id = participant_id and p.user_id = (select auth.uid()))
  )
  with check (
    status = 'pending'
    and exists (select 1 from public.participants p where p.id = participant_id and p.user_id = (select auth.uid()))
  );
create policy "host reviews submission" on public.social_bonus_submissions
  for update to authenticated
  using (exists (select 1 from public.participants p where p.id = participant_id and private.is_game_host(p.game_id)))
  with check (exists (select 1 from public.participants p where p.id = participant_id and private.is_game_host(p.game_id)));

-- ---------------------------------------------------------------------------
-- Grants: hide the answer key
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke select on public.choices from authenticated;
grant select (id, created_at, question_id, body, position) on public.choices to authenticated;

-- ---------------------------------------------------------------------------
-- Scoring: speed based, only inside the open window
-- ---------------------------------------------------------------------------
create function private.score_answer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  g public.games;
  q public.questions;
  c public.choices;
  reveal_delay constant interval := interval '2 seconds';
  grace constant interval := interval '1500 milliseconds';
  elapsed_ms integer;
  limit_ms integer;
begin
  select p.game_id into new.game_id from public.participants p where p.id = new.participant_id;
  select * into g from public.games where id = new.game_id;
  select * into q from public.questions where id = new.question_id;
  select * into c from public.choices where id = new.choice_id and question_id = new.question_id;

  if g.id is null or q.id is null or c.id is null or q.quiz_set_id <> g.quiz_set_id then
    raise exception 'invalid answer' using errcode = '22023';
  end if;
  if g.phase <> 'quiz' or g.is_answer_revealed or g.current_question_start_time is null
     or q."order" <> g.current_question_sequence then
    raise exception 'question is not open' using errcode = '22023';
  end if;

  limit_ms := q.time_limit * 1000;
  elapsed_ms := greatest(0, (extract(epoch from (now() - g.current_question_start_time - reveal_delay)) * 1000)::int);
  if now() > g.current_question_start_time + reveal_delay + make_interval(secs => q.time_limit) + grace then
    raise exception 'time is up' using errcode = '22023';
  end if;

  new.created_at := now();
  new.response_ms := least(elapsed_ms, limit_ms);
  new.is_correct := c.is_correct;
  new.score := case
    when c.is_correct then round(1000 * (1 - (new.response_ms::numeric / limit_ms) / 2))::int
    else 0
  end;
  return new;
end;
$$;

create trigger score_answer
  before insert on public.answers
  for each row execute function private.score_answer();

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

-- Create a quiz with its questions and choices in one transaction (runs as caller, RLS applies).
create function public.create_quiz(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  quiz_id uuid := coalesce((payload ->> 'id')::uuid, gen_random_uuid());
  question jsonb;
  choice jsonb;
  question_id uuid;
  q_index int := 0;
  c_index int;
begin
  insert into public.quiz_sets (id, created_by, name, description, image, is_public, social_bonus_points, social_share_link)
  values (
    quiz_id,
    (select auth.uid()),
    payload ->> 'name',
    nullif(payload ->> 'description', ''),
    nullif(payload ->> 'image', ''),
    coalesce((payload ->> 'is_public')::boolean, true),
    coalesce((payload ->> 'social_bonus_points')::smallint, 0),
    nullif(payload ->> 'social_share_link', '')
  );

  for question in select * from jsonb_array_elements(payload -> 'questions') loop
    insert into public.questions (quiz_set_id, body, image, "order", time_limit)
    values (
      quiz_id,
      question ->> 'body',
      nullif(question ->> 'image', ''),
      q_index,
      coalesce((question ->> 'time_limit')::smallint, 20)
    )
    returning id into question_id;

    if (select count(*) from jsonb_array_elements(question -> 'choices') x where (x ->> 'is_correct')::boolean) <> 1 then
      raise exception 'question % needs exactly one correct choice', q_index + 1 using errcode = '22023';
    end if;

    c_index := 0;
    for choice in select * from jsonb_array_elements(question -> 'choices') loop
      insert into public.choices (question_id, body, position, is_correct)
      values (question_id, choice ->> 'body', c_index, coalesce((choice ->> 'is_correct')::boolean, false));
      c_index := c_index + 1;
    end loop;
    q_index := q_index + 1;
  end loop;

  return quiz_id;
end;
$$;
revoke execute on function public.create_quiz(jsonb) from public, anon;
grant execute on function public.create_quiz(jsonb) to authenticated;

-- The correct choice for a question, once the game has revealed it (or to the quiz owner).
create function public.get_correct_choice(_game_id uuid, _question_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.id
  from public.choices c
  join public.questions q on q.id = c.question_id
  join public.games g on g.id = _game_id and g.quiz_set_id = q.quiz_set_id
  where c.question_id = _question_id
    and c.is_correct
    and private.is_game_member(g.id)
    and (
      g.phase = 'result'
      or q."order" < g.current_question_sequence
      or (q."order" = g.current_question_sequence and g.is_answer_revealed)
    )
  limit 1;
$$;

-- Answer distribution for a question, after the reveal (host sees it live).
create function public.get_question_stats(_game_id uuid, _question_id uuid)
returns table (choice_id uuid, answer_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, count(a.id)
  from public.choices c
  join public.questions q on q.id = c.question_id
  join public.games g on g.id = _game_id and g.quiz_set_id = q.quiz_set_id
  left join public.answers a on a.choice_id = c.id and a.game_id = g.id
  where c.question_id = _question_id
    and private.is_game_member(g.id)
    and (
      private.is_game_host(g.id)
      or g.phase = 'result'
      or q."order" < g.current_question_sequence
      or (q."order" = g.current_question_sequence and g.is_answer_revealed)
    )
  group by c.id, c.position
  order by c.position;
$$;

-- Standings for a game, visible to its host and players.
create function public.get_game_results(_game_id uuid)
returns table (
  participant_id uuid,
  user_id uuid,
  nickname text,
  avatar_url text,
  answer_score bigint,
  bonus_score bigint,
  total_score bigint,
  correct_count bigint,
  rank bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with scores as (
    select
      p.id as participant_id,
      p.user_id,
      p.nickname,
      pr.avatar_url,
      coalesce(sum(a.score), 0)::bigint as answer_score,
      case when sb.status = 'approved' then qs.social_bonus_points else 0 end::bigint as bonus_score,
      count(a.id) filter (where a.is_correct) as correct_count,
      min(p.created_at) as joined_at
    from public.participants p
    join public.games g on g.id = p.game_id
    join public.quiz_sets qs on qs.id = g.quiz_set_id
    left join public.profiles pr on pr.id = p.user_id
    left join public.answers a on a.participant_id = p.id
    left join public.social_bonus_submissions sb on sb.participant_id = p.id
    where p.game_id = _game_id and private.is_game_member(_game_id)
    group by p.id, p.user_id, p.nickname, pr.avatar_url, sb.status, qs.social_bonus_points
  )
  select participant_id, user_id, nickname, avatar_url, answer_score, bonus_score,
         answer_score + bonus_score as total_score, correct_count,
         rank() over (order by answer_score + bonus_score desc) as rank
  from scores
  order by total_score desc, joined_at asc;
$$;

-- Monthly leaderboard across all games played in [_start, _end).
create function public.get_monthly_leaderboard(_start timestamptz, _end timestamptz)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  total_score bigint,
  games_played bigint,
  rank bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with per_participant as (
    select
      p.user_id,
      coalesce((select sum(a.score) from public.answers a where a.participant_id = p.id), 0)
        + case when sb.status = 'approved' then qs.social_bonus_points else 0 end as score
    from public.participants p
    join public.games g on g.id = p.game_id
    join public.quiz_sets qs on qs.id = g.quiz_set_id
    left join public.social_bonus_submissions sb on sb.participant_id = p.id
    where g.created_at >= _start and g.created_at < _end
      and (select auth.uid()) is not null
  )
  select pp.user_id, pr.full_name, pr.avatar_url,
         sum(pp.score)::bigint as total_score,
         count(*)::bigint as games_played,
         rank() over (order by sum(pp.score) desc) as rank
  from per_participant pp
  join public.profiles pr on pr.id = pp.user_id
  group by pp.user_id, pr.full_name, pr.avatar_url
  order by total_score desc, pr.full_name
  limit 100;
$$;

-- The caller's game history (played and hosted).
create function public.get_my_history()
returns table (
  game_id uuid,
  quiz_name text,
  quiz_image text,
  quiz_set_id uuid,
  played_at timestamptz,
  role text,
  phase text,
  player_count bigint,
  my_score bigint,
  my_rank bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with mine as (
    select g.id as game_id, 'player'::text as role from public.participants p
    join public.games g on g.id = p.game_id
    where p.user_id = (select auth.uid())
    union
    select g.id, 'host' from public.games g where g.host_user_id = (select auth.uid())
  ),
  totals as (
    select p.game_id, p.user_id,
      coalesce(sum(a.score), 0)
        + max(case when sb.status = 'approved' then qs.social_bonus_points else 0 end) as score
    from public.participants p
    join public.games g on g.id = p.game_id
    join public.quiz_sets qs on qs.id = g.quiz_set_id
    left join public.answers a on a.participant_id = p.id
    left join public.social_bonus_submissions sb on sb.participant_id = p.id
    where p.game_id in (select game_id from mine)
    group by p.game_id, p.user_id
  ),
  ranked as (
    select t.*, rank() over (partition by t.game_id order by t.score desc) as rnk from totals t
  )
  select m.game_id, qs.name, qs.image, qs.id, g.created_at, m.role, g.phase,
         (select count(*) from public.participants p where p.game_id = m.game_id),
         r.score::bigint, r.rnk
  from mine m
  join public.games g on g.id = m.game_id
  join public.quiz_sets qs on qs.id = g.quiz_set_id
  left join ranked r on r.game_id = m.game_id and r.user_id = (select auth.uid())
  order by g.created_at desc
  limit 200;
$$;

revoke execute on function public.get_correct_choice(uuid, uuid) from public, anon;
revoke execute on function public.get_question_stats(uuid, uuid) from public, anon;
revoke execute on function public.get_game_results(uuid) from public, anon;
revoke execute on function public.get_monthly_leaderboard(timestamptz, timestamptz) from public, anon;
revoke execute on function public.get_my_history() from public, anon;
revoke execute on function public.generate_game_code() from public, anon;
grant execute on function public.get_correct_choice(uuid, uuid) to authenticated;
grant execute on function public.get_question_stats(uuid, uuid) to authenticated;
grant execute on function public.get_game_results(uuid) to authenticated;
grant execute on function public.get_monthly_leaderboard(timestamptz, timestamptz) to authenticated;
grant execute on function public.get_my_history() to authenticated;
grant execute on function public.generate_game_code() to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.games;
alter publication supabase_realtime add table public.participants;
alter publication supabase_realtime add table public.answers;
alter publication supabase_realtime add table public.social_bonus_submissions;
alter table public.participants replica identity full;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('quiz_images', 'quiz_images', true, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']),
  ('social_screenshots', 'social_screenshots', false, 10485760, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "quiz owner uploads images" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'quiz_images'
    and exists (
      select 1 from public.quiz_sets q
      where q.id::text = (storage.foldername(name))[1] and q.created_by = (select auth.uid())
    )
  );
create policy "quiz owner manages images" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'quiz_images'
    and exists (
      select 1 from public.quiz_sets q
      where q.id::text = (storage.foldername(name))[1] and q.created_by = (select auth.uid())
    )
  );

-- social_screenshots/<game_id>/<participant_id>/<file>
create policy "player uploads own screenshots" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'social_screenshots'
    and exists (
      select 1 from public.participants p
      where p.id::text = (storage.foldername(name))[2]
        and p.game_id::text = (storage.foldername(name))[1]
        and p.user_id = (select auth.uid())
    )
  );
create policy "player and host read screenshots" on storage.objects
  for select to authenticated using (
    bucket_id = 'social_screenshots'
    and exists (
      select 1 from public.participants p
      where p.id::text = (storage.foldername(name))[2]
        and p.game_id::text = (storage.foldername(name))[1]
        and (p.user_id = (select auth.uid()) or private.is_game_host(p.game_id))
    )
  );
