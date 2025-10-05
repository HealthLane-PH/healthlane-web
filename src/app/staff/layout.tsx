"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";
import Image from "next/image";


export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 h-full w-64 bg-[#272a2b] text-white flex flex-col justify-between z-40 transform transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <Sidebar onClose={() => setIsOpen(false)} />
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between bg-white shadow-sm p-4 sticky top-0 z-20">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <Image
            src="/images/healthlane-logo-horizontal.png"
            alt="HealthLane Logo"
            width={130}
            height={40}
            className="h-8 w-auto"
          />
          <div className="w-6" />
        </header>

        <main className="flex-1 w-full bg-gray-50 p-4 md:p-8">{children}</main>

      </div>
    </div>
  );
}
