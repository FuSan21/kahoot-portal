-- Create a secure view for quiz history that automatically filters by the current user
create or replace view quiz_history with (security_invoker = on) as
select g.id as game_id,
    g.created_at as played_at,
    qs.name as quiz_name,
    p.user_id,
    (
        select coalesce(sum(score), 0)
        from answers a
        where a.participant_id = p.id
    ) as total_score
from games g
    inner join participants p on p.game_id = g.id
    inner join quiz_sets qs on qs.id = g.quiz_set_id
where p.user_id = auth.uid();
-- This ensures users can only see their own history