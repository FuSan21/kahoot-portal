import SiteLogo from "@/app/host/dashboard/sitelogo.svg";
import HomeIcon from "@/app/components/icons/HomeIcon";
import HowToPlayIcon from "@/app/components/icons/HowToPlayIcon";
import Image from "next/image";
import Link from "next/link";

const menuItems: {
  label: string;
  href: string;
  icon: React.ReactNode;
}[] = [
  {
    label: "Home",
    href: "/host/dashboard",
    icon: <HomeIcon />,
  },
  {
    label: "How to Play",
    href: "/host/dashboard/how-to",
    icon: <HowToPlayIcon />,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row h-full flex-grow">
      <nav className="w-full sm:w-64 bg-gray-50 border-r border-gray-200">
        <div className="flex justify-center items-center py-4 px-6">
          <Link href="/host/dashboard">
            <Image priority src={SiteLogo} alt="Kahoot Portal" />
          </Link>
        </div>

        <div className="sm:mb-10">
          <h3 className="mx-6 mb-2 text-xs text-gray-400 uppercase tracking-widest">
            Main
          </h3>
          {menuItems.map((item) => (
            <Link
              href={item.href}
              key={item.href}
              className="flex items-center px-6 py-2.5 text-gray-500 hover:text-orange-600 group"
            >
              <div className="px-2">{item.icon}</div>
              <div className="flex-grow">{item.label}</div>
            </Link>
          ))}
        </div>
      </nav>

      <main className="p-2 sm:p-10 flex-grow">{children}</main>
    </div>
  );
}
