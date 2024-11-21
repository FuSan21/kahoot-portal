"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BASE_URL } from "@/constants";
import { createClient } from "@/utils/supabase/server";
import { generateNonce } from "@/utils/nonce";

export async function signInWithGoogle(redirectTo?: string) {
  const supabase = await createClient();
  const [nonce, hashedNonce] = await generateNonce();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${BASE_URL}/auth/callback?redirect=${encodeURIComponent(
        redirectTo || `${BASE_URL}/host/dashboard`
      )}`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
        nonce: hashedNonce,
      },
    },
  });

  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect(data.url);
}
