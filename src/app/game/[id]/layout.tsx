import { Header } from "@/components/Header";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen h-screen flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
