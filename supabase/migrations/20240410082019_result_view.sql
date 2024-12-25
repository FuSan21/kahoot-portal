create or replace view game_results with (security_invoker = on) as
select participants.id as participant_id,
    participants.nickname,
    sum(answers.score) + COALESCE(
        (
            select quiz_sets.social_bonus_points
            from social_bonus_submissions
                inner join games g2 on g2.id = participants.game_id
                inner join quiz_sets on g2.quiz_set_id = quiz_sets.id
            where social_bonus_submissions.participant_id = participants.id
                and social_bonus_submissions.is_approved = true
            limit 1
        ), 0
    ) as total_score,
    games.id as game_id,
    array_agg(
        answers.score
        order by questions.order
    ) || COALESCE(
        (
            select ARRAY [quiz_sets.social_bonus_points]
            from social_bonus_submissions
                inner join games g2 on g2.id = participants.game_id
                inner join quiz_sets on g2.quiz_set_id = quiz_sets.id
            where social_bonus_submissions.participant_id = participants.id
                and social_bonus_submissions.is_approved = true
            limit 1
        ), ARRAY []::integer []
    ) as scores
from games
    inner join quiz_sets on games.quiz_set_id = quiz_sets.id
    inner join questions on quiz_sets.id = questions.quiz_set_id
    inner join answers on questions.id = answers.question_id
    inner join participants on answers.participant_id = participants.id
    and games.id = participants.game_id
group by games.id,
    participants.id;