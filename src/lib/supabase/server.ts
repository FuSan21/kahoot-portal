import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component: the proxy refreshes the session instead.
          }
        },
      },
    },
  );
}

/** The signed-in user's id and profile, or null. */
export const getViewer = cache(async function getViewer() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("id", userId)
    .single();
  return {
    id: userId,
    email: (data.claims.email as string | undefined) ?? null,
    name: profile?.full_name ?? (data.claims.email as string | undefined)?.split("@")[0] ?? "Player",
    avatarUrl: profile?.avatar_url ?? null,
  };
});

export type Viewer = NonNullable<Awaited<ReturnType<typeof getViewer>>>;
