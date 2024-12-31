import { Header } from "@/components/Header";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full flex flex-col">
      <Header />
      <div className="flex-1 h-[calc(100vh-3.5rem)]">{children}</div>
    </div>
  );
}
