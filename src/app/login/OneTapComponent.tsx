"use client";

import Script from "next/script";
import { createClient } from "@/utils/supabase/client";
import { CredentialResponse } from "google-one-tap";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BASE_URL } from "@/constants";
import { generateNonce } from "@/utils/nonce";

interface OneTapComponentProps {
  redirectTo?: string;
}

const OneTapComponent = ({ redirectTo }: OneTapComponentProps) => {
  const supabase = createClient();
  const router = useRouter();

  const initializeGoogleOneTap = async () => {
    const [nonce, hashedNonce] = await generateNonce();

    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error getting session", error);
    }
    if (data.session) {
      const destination = redirectTo || `${BASE_URL}/host/dashboard`;
      router.push(destination);
      return;
    }

    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        callback: async (response: CredentialResponse) => {
          try {
            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: "google",
              token: response.credential,
              nonce,
            });

            if (error) throw error;

            const destination = redirectTo || `${BASE_URL}/host/dashboard`;
            router.push(destination);
          } catch (error) {
            console.error("Error logging in with Google One Tap", error);
            router.push("/error");
          }
        },
        nonce: hashedNonce,
        use_fedcm_for_prompt: true,
      });
      window.google.accounts.id.prompt();
    }
  };

  useEffect(() => {
    const onLoad = async () => {
      await initializeGoogleOneTap();
    };

    if (window.google) {
      onLoad();
    }
  }, [redirectTo]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        onLoad={() => initializeGoogleOneTap()}
      />
      <div id="oneTap" className="fixed top-0 right-0 z-[100]" />
    </>
  );
};

export default OneTapComponent;
