import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { createClient } from "@/utils/supabase/server";
import UserCard from "@/app/components/UserCard";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kahoots Portal",
  description: "Kahoot Quiz Platform powered by Next.js 14 and Supabase",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <header className="h-16 px-2 flex justify-between border-b border-gray-200 items-center">
            <a href="/">
              <h1>Kahoot Portal</h1>
            </a>
            {user && (
              <div className="relative">
                <UserCard user={user} />
              </div>
            )}
          </header>
          <main className="flex-grow flex flex-col">{children}</main>
        </div>
        <Toaster richColors />
      </body>
    </html>
  );
}
