-- Create a view for monthly leaderboard that includes user details and scores
create or replace view monthly_leaderboard_view as
select p.user_id,
    u.email,
    prof.full_name,
    prof.avatar_url,
    g.created_at as played_at,
    (
        select coalesce(sum(score), 0)
        from answers a
        where a.participant_id = p.id
    ) + COALESCE(
        (
            select qs.social_bonus_points
            from social_bonus_submissions sbs
            where sbs.participant_id = p.id
                and sbs.is_approved = true
            limit 1
        ), 0
    ) as total_score
from games g
    inner join participants p on p.game_id = g.id
    inner join quiz_sets qs on qs.id = g.quiz_set_id
    inner join auth.users u on p.user_id = u.id
    left join profiles prof on p.user_id = prof.id
where p.user_id is not null;
-- Create the function to get monthly leaderboard using the view
create or replace function public.get_monthly_leaderboard(start_date timestamp, end_date timestamp) returns table (
        user_id uuid,
        email text,
        full_name text,
        avatar_url text,
        total_score bigint
    ) language sql security definer as $$
SELECT mlv.user_id,
    mlv.email,
    mlv.full_name,
    mlv.avatar_url,
    SUM(mlv.total_score) as total_score
FROM monthly_leaderboard_view mlv
WHERE mlv.played_at >= start_date
    AND mlv.played_at <= end_date
GROUP BY mlv.user_id,
    mlv.email,
    mlv.full_name,
    mlv.avatar_url
ORDER BY total_score DESC;
$$;