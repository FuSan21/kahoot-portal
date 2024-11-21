import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import UserCard from "@/app/components/UserCard";
import Link from "next/link";

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
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <header className="h-16 px-2 flex justify-between border-b border-gray-200 items-center z-[99]">
          <Link href="/">
            <h1>Kahoot Portal</h1>
          </Link>
          <UserCard />
        </header>
        <main className="flex-grow flex flex-col">{children}</main>
        <Toaster richColors />
      </body>
    </html>
  );
}
