create or replace view game_results with (security_invoker = on) as with social_bonus as (
        select social_bonus_submissions.participant_id,
            quiz_sets.social_bonus_points
        from social_bonus_submissions
            inner join participants on participants.id = social_bonus_submissions.participant_id
            inner join games g2 on g2.id = participants.game_id
            inner join quiz_sets on g2.quiz_set_id = quiz_sets.id
        where social_bonus_submissions.status = 'approved'
            and quiz_sets.social_bonus_points > 0
    )
select participants.id as participant_id,
    participants.nickname,
    sum(answers.score) + COALESCE(social_bonus.social_bonus_points, 0) as total_score,
    games.id as game_id,
    case
        when social_bonus.social_bonus_points is not null then array_agg(
            answers.score
            order by questions.order
        ) || ARRAY [social_bonus.social_bonus_points]
        else array_agg(
            answers.score
            order by questions.order
        )
    end as scores,
    social_bonus.social_bonus_points is not null as has_social_bonus
from games
    inner join quiz_sets on games.quiz_set_id = quiz_sets.id
    inner join questions on quiz_sets.id = questions.quiz_set_id
    inner join answers on questions.id = answers.question_id
    inner join participants on answers.participant_id = participants.id
    and games.id = participants.game_id
    left join social_bonus on social_bonus.participant_id = participants.id
group by games.id,
    participants.id,
    social_bonus.social_bonus_points;