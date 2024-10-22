create or replace view game_results as
select participants.id as participant_id,
    participants.nickname,
    sum(answers.score) as total_score,
    games.id as game_id,
    array_agg(
        answers.score
        order by questions.order
    ) as scores
from games
    inner join quiz_sets on games.quiz_set_id = quiz_sets.id
    inner join questions on quiz_sets.id = questions.quiz_set_id
    inner join answers on questions.id = answers.question_id
    inner join participants on answers.participant_id = participants.id
    and games.id = participants.game_id
group by games.id,
    participants.id;