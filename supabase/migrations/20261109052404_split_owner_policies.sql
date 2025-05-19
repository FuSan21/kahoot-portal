-- Split "for all" owner policies so SELECT has a single permissive policy.
drop policy "owner writes questions" on public.questions;
create policy "owner inserts questions" on public.questions
  for insert to authenticated with check (private.owns_quiz(quiz_set_id));
create policy "owner updates questions" on public.questions
  for update to authenticated
  using (private.owns_quiz(quiz_set_id)) with check (private.owns_quiz(quiz_set_id));
create policy "owner deletes questions" on public.questions
  for delete to authenticated using (private.owns_quiz(quiz_set_id));

drop policy "owner writes choices" on public.choices;
create policy "owner inserts choices" on public.choices
  for insert to authenticated
  with check (exists (select 1 from public.questions q where q.id = question_id and private.owns_quiz(q.quiz_set_id)));
create policy "owner updates choices" on public.choices
  for update to authenticated
  using (exists (select 1 from public.questions q where q.id = question_id and private.owns_quiz(q.quiz_set_id)))
  with check (exists (select 1 from public.questions q where q.id = question_id and private.owns_quiz(q.quiz_set_id)));
create policy "owner deletes choices" on public.choices
  for delete to authenticated
  using (exists (select 1 from public.questions q where q.id = question_id and private.owns_quiz(q.quiz_set_id)));

-- One update policy for submissions: the host reviews, the player resubmits after a rejection.
drop policy "player resubmits after rejection" on public.social_bonus_submissions;
drop policy "host reviews submission" on public.social_bonus_submissions;
create policy "host reviews or player resubmits" on public.social_bonus_submissions
  for update to authenticated
  using (
    exists (
      select 1 from public.participants p
      where p.id = participant_id
        and (private.is_game_host(p.game_id) or (p.user_id = (select auth.uid()) and status = 'rejected'))
    )
  )
  with check (
    exists (
      select 1 from public.participants p
      where p.id = participant_id
        and (private.is_game_host(p.game_id) or (p.user_id = (select auth.uid()) and status = 'pending'))
    )
  );
