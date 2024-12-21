create or replace function add_question (
    quiz_set_id uuid,
    body text,
    "order" int,
    choices json [],
    "image" text default null
  ) returns void language plpgsql security definer
set search_path = '' as $$
declare question_id uuid;
choice json;
creator_id uuid;
begin -- First verify the caller owns this quiz_set
select created_by into creator_id
from public.quiz_sets
where id = quiz_set_id;
if creator_id != auth.uid() then raise exception 'Not authorized to add questions to this quiz set';
end if;
insert into public.questions(body, "image", "order", quiz_set_id)
values (
    add_question.body,
    add_question."image",
    add_question."order",
    add_question.quiz_set_id
  )
returning id into question_id;
foreach choice in array choices loop
insert into public.choices (question_id, body, is_correct)
values (
    question_id,
    choice->>'body',
    (choice->>'is_correct')::boolean
  );
end loop;
end;
$$;
alter table public.quiz_sets enable row level security;
create policy "Quiz sets are viewable by everyone" on public.quiz_sets for
select using (true);
alter table public.questions enable row level security;
create policy "Questions are viewable by everyone" on public.questions for
select using (true);
alter table public.choices enable row level security;
create policy "Choices are viewable by everyone" on public.choices for
select using (true);
alter table public.games
add column host_user_id uuid default auth.uid() references auth.users(id) on delete
set null on update cascade;
alter table public.games enable row level security;
create policy "Choices are viewable by everyone" on public.games for
select using (true);
create policy "Host can start a game" on public.games for
insert with check (auth.uid() = host_user_id);
create policy "Host can update their games" on public.games for
update using (auth.uid() = host_user_id) with check (auth.uid() = host_user_id);
alter table public.participants enable row level security;
create policy "Participants are viewable by everyone." on public.participants for
select using (true);
create policy "Participants can insert or update themselves" on public.participants for
insert with check (auth.uid() = user_id);
create policy "Participants can update themselves" on public.participants for
update using (auth.uid() = user_id);
alter table public.answers enable row level security;
create policy "Answers are viewable by everyone." on public.answers for
select using (true);
create policy "Participants can insert their own answers" on public.answers for
insert with check (true);
alter table public.answers
add column choice_id uuid references public.choices(id) on delete
set null on update cascade;
alter publication supabase_realtime
add table public.answers;
create policy "Users can create their own quiz sets" on public.quiz_sets for
insert with check (created_by = auth.uid());
create policy "Users can update their own quiz sets" on public.quiz_sets for
update using (created_by = auth.uid());
create policy "Users can delete their own quiz sets" on public.quiz_sets for delete using (created_by = auth.uid());
create policy "Users can insert questions" on public.questions for
insert with check (
    exists (
      select 1
      from public.quiz_sets
      where id = quiz_set_id
        and created_by = auth.uid()
    )
  );
create policy "Users can insert choices" on public.choices for
insert with check (
    exists (
      select 1
      from public.questions q
        join public.quiz_sets qs on q.quiz_set_id = qs.id
      where q.id = question_id
        and qs.created_by = auth.uid()
    )
  );