"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { QUIZ_WITH_QUESTIONS, sortQuiz, type Answer, type Game, type ParticipantWithProfile, type QuizWithQuestions } from "@/lib/game";
import { createClient } from "@/lib/supabase/client";

// Unique per mount: realtime-js reuses channels by topic, so two mounts must never share one.
function channelName(scope: string) {
  return `${scope}:${crypto.randomUUID().slice(0, 8)}`;
}

let realtimeReady: Promise<void> | null = null;

/** Joins only after the session is loaded, so RLS sees the user and not the anon role. */
function whenRealtimeReady() {
  realtimeReady ??= (async () => {
    const supabase = createClient();
    await supabase.auth.getSession();
    await supabase.realtime.setAuth();
  })();
  return realtimeReady;
}

/** Subscribes once realtime is authorised; returns the cleanup. */
export function subscribe(build: () => RealtimeChannel) {
  let channel: RealtimeChannel | null = null;
  let cancelled = false;
  void whenRealtimeReady().then(() => {
    if (!cancelled) channel = build();
  });
  return () => {
    cancelled = true;
    if (channel) void createClient().removeChannel(channel);
  };
}

/** The game row (kept live) and its quiz with ordered questions and choices. */
export function useLiveGame(gameId: string) {
  const [game, setGame] = useState<Game | null>(null);
  const [quiz, setQuiz] = useState<QuizWithQuestions | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchGame = useCallback(async () => {
    const { data, error } = await createClient().from("games").select("*").eq("id", gameId).maybeSingle();
    if (error || !data) {
      setError("This game does not exist or has been closed.");
      return null;
    }
    setGame(data);
    return data;
  }, [gameId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const g = await fetchGame();
      if (!g || cancelled) return;
      const { data, error } = await createClient().from("quiz_sets").select(QUIZ_WITH_QUESTIONS).eq("id", g.quiz_set_id).single();
      if (cancelled) return;
      if (error || !data) setError("This quiz could not be loaded.");
      else setQuiz(sortQuiz(data as unknown as QuizWithQuestions));
    })();

    const unsubscribe = subscribe(() =>
      createClient()
        .channel(channelName(`game-${gameId}`))
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameId}` }, (payload) =>
          setGame(payload.new as Game),
        )
        .subscribe((status) => {
          // Catch anything that changed between the first fetch and the subscription.
          if (status === "SUBSCRIBED") void fetchGame();
        }),
    );

    // Safety net for dropped sockets: resync on focus and every few seconds.
    const resync = () => document.visibilityState === "visible" && void fetchGame();
    document.addEventListener("visibilitychange", resync);
    const poll = window.setInterval(resync, 4000);

    return () => {
      cancelled = true;
      unsubscribe();
      document.removeEventListener("visibilitychange", resync);
      window.clearInterval(poll);
    };
  }, [gameId, fetchGame]);

  const question = useMemo(() => (game && quiz ? (quiz.questions[game.current_question_sequence] ?? null) : null), [game, quiz]);

  return { game, setGame, quiz, question, error };
}

/** Players in the lobby/game, kept live. */
export function useParticipants(gameId: string) {
  const [participants, setParticipants] = useState<ParticipantWithProfile[]>([]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const { data } = await supabase
        .from("participants")
        .select("*, profile:profiles(avatar_url)")
        .eq("game_id", gameId)
        .order("created_at");
      if (!cancelled && data) setParticipants(data);
    }

    const unsubscribe = subscribe(() =>
      supabase
        .channel(channelName(`participants-${gameId}`))
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "participants", filter: `game_id=eq.${gameId}` },
          async (payload) => {
            const row = payload.new as ParticipantWithProfile;
            const { data: profile } = await supabase.from("profiles").select("avatar_url").eq("id", row.user_id).maybeSingle();
            setParticipants((list) => (list.some((p) => p.id === row.id) ? list : [...list, { ...row, profile }]));
          },
        )
        .on("postgres_changes", { event: "DELETE", schema: "public", table: "participants", filter: `game_id=eq.${gameId}` }, (payload) =>
          setParticipants((list) => list.filter((p) => p.id !== (payload.old as { id: string }).id)),
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") void load();
        }),
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [gameId]);

  return participants;
}

/** Answers for one question (the host sees all; RLS limits players to their own). */
export function useQuestionAnswers(gameId: string, questionId: string | undefined) {
  const [state, setState] = useState<{ questionId?: string; answers: Answer[] }>({ answers: [] });

  useEffect(() => {
    if (!questionId) return;
    const supabase = createClient();
    let cancelled = false;
    const add = (rows: Answer[]) =>
      setState((s) => {
        const base = s.questionId === questionId ? s.answers : [];
        const fresh = rows.filter((r) => r.question_id === questionId && !base.some((a) => a.id === r.id));
        return { questionId, answers: [...base, ...fresh] };
      });

    async function load() {
      const { data } = await supabase.from("answers").select("*").eq("game_id", gameId).eq("question_id", questionId!);
      if (!cancelled && data) add(data);
    }

    const unsubscribe = subscribe(() =>
      supabase
        .channel(channelName(`answers-${gameId}`))
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "answers", filter: `game_id=eq.${gameId}` }, (payload) =>
          add([payload.new as Answer]),
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") void load();
        }),
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [gameId, questionId]);

  return state.questionId === questionId ? state.answers : [];
}

type RevealState = { questionId: string; correctId: string | null; counts: Record<string, number> };

/** Correct choice and answer distribution, fetched once the answer is revealed. */
export function useReveal(gameId: string, questionId: string | undefined, revealed: boolean) {
  const [state, setState] = useState<RevealState | null>(null);

  useEffect(() => {
    if (!questionId || !revealed) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const [correct, stats] = await Promise.all([
        supabase.rpc("get_correct_choice", { _game_id: gameId, _question_id: questionId }),
        supabase.rpc("get_question_stats", { _game_id: gameId, _question_id: questionId }),
      ]);
      if (cancelled) return;
      setState({
        questionId,
        correctId: correct.data ?? null,
        counts: Object.fromEntries((stats.data ?? []).map((s) => [s.choice_id, Number(s.answer_count)])),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [gameId, questionId, revealed]);

  return revealed && state?.questionId === questionId ? state : null;
}

export async function fetchResults(gameId: string) {
  const { data } = await createClient().rpc("get_game_results", { _game_id: gameId });
  return data ?? [];
}
