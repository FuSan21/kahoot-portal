"use client";

import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { BASE_URL } from "@/constants";

interface GoogleLoginButtonProps {
  redirectTo?: string;
}

export default function GoogleLoginButton({
  redirectTo,
}: GoogleLoginButtonProps) {
  const supabase = createClient();
  const router = useRouter();

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: credentialResponse.credential!,
      });

      if (error) throw error;

      const destination = redirectTo
        ? `${BASE_URL}/${redirectTo}`
        : `${BASE_URL}/host/dashboard`;
      router.push(destination);
    } catch (error) {
      console.error("Error logging in with Google:", error);
      router.push("/error");
    }
  };

  return (
    <div className="flex justify-center">
      <GoogleLogin
        auto_select
        use_fedcm_for_prompt
        itp_support
        onSuccess={handleSuccess}
        onError={() => {
          console.error("Login Failed");
          router.push("/error");
        }}
        useOneTap
        type="standard"
        theme="outline"
        size="large"
        text="signin_with"
        shape="rectangular"
        width="300"
        locale="en"
      />
    </div>
  );
}
