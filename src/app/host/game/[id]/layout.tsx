import { Header } from "@/components/Header";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 min-h-[calc(100vh-3.5rem)] overflow-auto">
        {children}
      </div>
    </div>
  );
}
