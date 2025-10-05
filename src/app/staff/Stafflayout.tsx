"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Image from "next/image";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#1F2326] text-white transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 p-4 border-b border-gray-700">
          <Image
            src="/images/healthlane-logo-white.png"
            alt="HealthLane Logo"
            width={28}
            height={28}
          />
          <span className="text-xl font-semibold">HealthLane</span>
        </div>

        {/* Nav Links */}
        <nav className="mt-6 space-y-1 px-3">
          <Link
            href="/staff/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-700 transition"
          >
            <span>🏠</span> Home
          </Link>
          <Link
            href="/staff/clinics"
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-700 transition"
          >
            <span>🏥</span> Facilities
          </Link>
          <Link
            href="/staff/patients"
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-700 transition"
          >
            <span>👥</span> Patients
          </Link>
          <Link
            href="/staff/support"
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-700 transition"
          >
            <span>💬</span> Support Tickets
          </Link>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-gray-700">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center text-xs font-semibold">
              T
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Chace</span>
              <span className="text-xs text-gray-400">test@healthlane.com</span>
            </div>
          </div>
          <button className="mt-3 text-sm text-gray-400 hover:text-white">↩ Logout</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Navbar */}
        <header className="lg:hidden flex items-center justify-between bg-white shadow-sm p-4 sticky top-0 z-30">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <h1 className="text-lg font-semibold text-gray-800">HealthLane</h1>
          <div className="w-6" /> {/* spacer */}
        </header>

        {/* Content */}
        <main className="flex-1 w-full bg-gray-50 p-4 md:p-8">{children}</main>

      </div>
    </div>
  );
}