import Link from "next/link";
import UserCard from "@/app/components/UserCard";

export function Header() {
  return (
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
  );
}
