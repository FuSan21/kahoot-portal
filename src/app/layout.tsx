import type { Metadata, Viewport } from "next";
import { DM_Mono, Outfit } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dm-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Kahoot Portal: live quiz games", template: "%s · Kahoot Portal" },
  description: "Host live multiplayer quizzes and play from any phone with a six-digit code.",
};

export const viewport: Viewport = {
  themeColor: "#18191b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${outfit.variable} ${dmMono.variable}`}>
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
