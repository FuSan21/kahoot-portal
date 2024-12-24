-- Create function to calculate scores based on order of correct answers
CREATE OR REPLACE FUNCTION calculate_answer_score() RETURNS TRIGGER AS $$
DECLARE is_correct_answer BOOLEAN;
correct_choice_id UUID;
answer_position INTEGER;
current_game_id UUID;
BEGIN -- Get the game_id for this answer through the participant
SELECT game_id INTO current_game_id
FROM participants
WHERE id = NEW.participant_id;
-- Get the correct choice for this question
SELECT id INTO correct_choice_id
FROM choices
WHERE question_id = NEW.question_id
    AND is_correct = true;
-- Check if the answer is correct
is_correct_answer := NEW.choice_id = correct_choice_id;
IF is_correct_answer THEN -- Get the position of this answer among correct answers for this question IN THIS GAME
SELECT COUNT(*) + 1 INTO answer_position
FROM answers a
    JOIN participants p ON p.id = a.participant_id
WHERE a.question_id = NEW.question_id
    AND a.choice_id = correct_choice_id
    AND p.game_id = current_game_id
    AND a.created_at < NEW.created_at;
-- Assign score based on position (3 for 1st, 2 for 2nd, 1 for 3rd and later)
NEW.score := CASE
    WHEN answer_position = 1 THEN 3
    WHEN answer_position = 2 THEN 2
    ELSE 1
END;
ELSE -- Wrong answer gets 0 points
NEW.score := 0;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Create trigger that runs before insert on answers
DROP TRIGGER IF EXISTS calculate_score_trigger ON answers;
CREATE TRIGGER calculate_score_trigger BEFORE
INSERT ON answers FOR EACH ROW EXECUTE FUNCTION calculate_answer_score();