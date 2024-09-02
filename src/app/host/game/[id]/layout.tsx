import RootLayout from "@/app/layout";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RootLayout>{children}</RootLayout>;
}
