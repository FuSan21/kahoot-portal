import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getViewer } from "@/lib/supabase/server";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  return (
    <>
      <SiteHeader viewer={viewer} />
      <main id="main" className="mx-auto w-full max-w-7xl px-5 pb-24 sm:px-8">
        {children}
      </main>
    </>
  );
}
