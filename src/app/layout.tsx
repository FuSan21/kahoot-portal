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
        <header className="h-16 px-4 flex justify-between items-center border-b border-gray-200 bg-white">
          <Link
            href="/"
            className="text-xl font-semibold text-gray-800 hover:text-gray-600"
          >
            Kahoot Portal
          </Link>
          <UserCard />
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
