import SiteLogo from "@/app/host/dashboard/sitelogo.svg";
import Image from "next/image";
import Link from "next/link";
import { Home, Plus, History, HelpCircle, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Header } from "@/components/Header";

const menuItems: {
  label: string;
  href: string;
  icon: React.ReactNode;
}[] = [
  {
    label: "Home",
    href: "/host/dashboard",
    icon: <Home className="w-5 h-5" />,
  },
  {
    label: "Create Quiz",
    href: "/host/dashboard/create",
    icon: <Plus className="w-5 h-5" />,
  },
  {
    label: "Quiz History",
    href: "/host/dashboard/history",
    icon: <History className="w-5 h-5" />,
  },
  {
    label: "How to Play",
    href: "/host/dashboard/how-to",
    icon: <HelpCircle className="w-5 h-5" />,
  },
];

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

function Sidebar({ className }: SidebarProps) {
  return (
    <div className={cn("pb-12", className)}>
      <div className="flex justify-center items-center py-4 px-6">
        <Link href="/host/dashboard">
          <Image priority src={SiteLogo} alt="Kahoot Portal" />
        </Link>
      </div>
      <div className="px-3 py-2">
        <h3 className="mx-3 mb-2 text-xs text-muted-foreground uppercase tracking-widest">
          Main
        </h3>
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <div className="mr-2">{item.icon}</div>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full flex flex-col">
      <Header />
      <div className="flex-1 flex">
        {/* Sidebar for desktop */}
        <aside className="hidden lg:flex w-64 border-r bg-background">
          <Sidebar className="w-full" />
        </aside>

        {/* Sheet for mobile */}
        <Sheet>
          <SheetTrigger asChild className="lg:hidden absolute left-4 top-4">
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
