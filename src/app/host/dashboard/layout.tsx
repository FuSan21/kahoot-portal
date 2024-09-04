import "../../globals.css";
import RootLayout from "@/app/layout";
import SiteLogo from "@/app/host/dashboard/sitelogo.svg";
import Image from "next/image";

const menuItems: {
  label: string;
  href: string;
  icon: React.ReactNode;
}[] = [
  {
    label: "Home",
    href: "/host/dashboard",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
        />
      </svg>
    ),
  },
  {
    label: "How to Play",
    href: "/host/dashboard/how-to",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
        />
      </svg>
    ),
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RootLayout>
      <div className="min-h-screen flex flex-col">
        <header className="h-16 px-2 flex justify-between border-b border-gray-200 items-center">
          <h1>Kahoot Portal</h1>
        </header>
        <div className="flex flex-col sm:flex-row h-full flex-grow">
          <nav className="w-full sm:w-64 bg-gray-50 border-r border-gray-200">
            <div className="flex justify-center items-center py-4 px-6">
              <a href="/host/dashboard">
                <Image priority src={SiteLogo} alt="Kahoot Portal" />
              </a>
            </div>

            <div className="sm:mb-10">
              <h3 className="mx-6 mb-2 text-xs text-gray-400 uppercase tracking-widest">
                Main
              </h3>
              {menuItems.map((item) => (
                <a
                  href={item.href}
                  key={item.href}
                  className="flex items-center px-6 py-2.5 text-gray-500 hover:text-orange-600 group"
                >
                  <div className="px-2">{item.icon}</div>
                  <div className="flex-grow">{item.label}</div>
                </a>
              ))}
            </div>
          </nav>

          <main className="p-2 sm:p-10 flex-grow">{children}</main>
        </div>
      </div>
    </RootLayout>
  );
}
