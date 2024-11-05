import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function PrivatePage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/");
  }

  return (
    <>
      <p>Hello {data.user.email}</p>
      <p>User data:</p>
      <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
        <code>{JSON.stringify(data.user, null, 2)}</code>
      </pre>
    </>
  );
}
