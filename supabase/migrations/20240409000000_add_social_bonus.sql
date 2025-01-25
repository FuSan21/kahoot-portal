-- Add social media bonus fields to quiz_sets table
ALTER TABLE public.quiz_sets
ADD COLUMN social_share_link text,
    ADD COLUMN social_bonus_points smallint DEFAULT 0;
-- Create a new storage bucket for social media screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('social_screenshots', 'social_screenshots', true) ON CONFLICT (id) DO NOTHING;
-- Create social bonus submissions table with simpler schema
CREATE TABLE IF NOT EXISTS public.social_bonus_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE ON UPDATE CASCADE,
    screenshot_urls text [] NOT NULL DEFAULT '{}',
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);
-- Add RLS policies for social bonus submissions
ALTER TABLE public.social_bonus_submissions ENABLE ROW LEVEL SECURITY;
-- Participants can view their own submissions
CREATE POLICY "Participants can view their own submissions" ON public.social_bonus_submissions FOR
SELECT USING (
        participant_id IN (
            SELECT id
            FROM public.participants
            WHERE user_id = auth.uid()
        )
    );
-- Participants can insert their own submissions
CREATE POLICY "Participants can insert their own submissions" ON public.social_bonus_submissions FOR
INSERT WITH CHECK (
        participant_id IN (
            SELECT id
            FROM public.participants
            WHERE user_id = auth.uid()
        )
    );
-- Quiz creators can view and approve submissions for their quizzes
CREATE POLICY "Quiz creators can view and approve submissions" ON public.social_bonus_submissions FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.participants p
            JOIN public.games g ON p.game_id = g.id
            JOIN public.quiz_sets qs ON g.quiz_set_id = qs.id
        WHERE p.id = participant_id
            AND qs.created_by = auth.uid()
    )
);
-- Add storage policies for social media screenshots
CREATE POLICY "Allow public read access to social screenshots" ON storage.objects FOR
SELECT USING (bucket_id = 'social_screenshots');
CREATE POLICY "Allow participants to upload social screenshots" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
        bucket_id = 'social_screenshots'
        AND EXISTS (
            SELECT 1
            FROM public.participants
            WHERE id = (storage.foldername(name)) [2]::uuid
                AND user_id = auth.uid()
        )
    );
CREATE POLICY "Allow quiz creators to view social screenshots" ON storage.objects FOR
SELECT TO authenticated USING (
        bucket_id = 'social_screenshots'
        AND EXISTS (
            SELECT 1
            FROM public.participants p
                JOIN public.games g ON p.game_id = g.id
                JOIN public.quiz_sets qs ON g.quiz_set_id = qs.id
            WHERE p.id = (storage.foldername(name)) [2]::uuid
                AND qs.created_by = auth.uid()
        )
    );
-- Create function to get social bonus submissions for a game
CREATE OR REPLACE FUNCTION get_game_social_bonus_submissions(_game_id uuid) RETURNS TABLE (
        id uuid,
        participant_id uuid,
        screenshot_urls text [],
        status text,
        created_at timestamptz,
        participant_nickname text
    ) AS $$ BEGIN RETURN QUERY
SELECT s.id,
    s.participant_id,
    s.screenshot_urls,
    s.status,
    s.created_at,
    p.nickname as participant_nickname
FROM social_bonus_submissions s
    INNER JOIN participants p ON s.participant_id = p.id
WHERE p.game_id = _game_id
ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Add social_bonus_submissions to realtime publication
alter publication supabase_realtime
add table social_bonus_submissions;