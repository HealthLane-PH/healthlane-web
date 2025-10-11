"use client";

import { usePathname } from "next/navigation";
import Header from "./components/Header";

export default function RootWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStaffSection = pathname.startsWith("/staff");

  // 🔹 STAFF PAGES — full screen layout (sidebar, dashboards, etc.)
  if (isStaffSection) {
    return <>{children}</>;
  }

  // 🔹 PUBLIC PAGES — full-width navbar, contained page content
  return (
    <>
      {/* Full-width sticky navbar */}
      <div className="w-full fixed top-0 left-0 z-50 bg-white shadow-sm">
        <Header />
      </div>

      {/* Contained content below navbar */}
      <main className="max-w-md md:max-w-3xl lg:max-w-6xl mx-auto px-4 pt-24 pb-12 bg-grayBg min-h-screen">
        {children}
      </main>
    </>
  );
}
