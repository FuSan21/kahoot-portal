"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

let cachedOffset: number | null = null;

/** Returns a now() aligned with the database clock (question timers are stamped server side). */
export function useServerClock() {
  const [offset, setOffset] = useState(cachedOffset ?? 0);

  useEffect(() => {
    if (cachedOffset !== null) return;
    let cancelled = false;
    (async () => {
      const t0 = Date.now();
      const { data } = await createClient().rpc("server_now");
      const t1 = Date.now();
      if (!data || cancelled) return;
      cachedOffset = new Date(data).getTime() - (t0 + t1) / 2;
      setOffset(cachedOffset);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return useCallback(() => Date.now() + offset, [offset]);
}

/** Re-renders every `interval` ms while `active`, returning the current server-aligned time. */
export function useTicker(active: boolean, interval = 200) {
  const now = useServerClock();
  const [time, setTime] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const tick = () => setTime(now());
    tick();
    const id = window.setInterval(tick, interval);
    return () => window.clearInterval(id);
  }, [active, interval, now]);

  return time;
}
