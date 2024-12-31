import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { Toaster } from "sonner";
import { Providers } from "@/app/providers";
import UserCard from "@/app/components/UserCard";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kahoots Portal",
  description: "Kahoot Quiz Platform powered by Next.js 15 and Supabase",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container-wrapper">
            <div className="flex h-14 items-center">
              <div className="flex-1">
                <Link href="/" className="flex items-center space-x-2">
                  <span className="font-bold inline-block">Kahoot Portal</span>
                </Link>
              </div>
              <div className="w-48 flex justify-end">
                <UserCard />
              </div>
            </div>
          </div>
        </header>
        <main className="flex-grow flex flex-col">
          <Providers>
            {children}
            <Toaster richColors />
          </Providers>
        </main>
      </body>
    </html>
  );
}
