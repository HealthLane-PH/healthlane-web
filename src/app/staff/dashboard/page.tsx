"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { useState } from "react";

export default function StaffDashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(auth.currentUser?.email ?? null);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/staff/staff-login");
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="p-6 text-2xl font-bold text-green-500">bit space</div>

          {/* Nav */}
          <nav className="flex flex-col gap-2 px-4">
            <a className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 cursor-pointer">
              <span>🏠</span> Camps
            </a>
            <a className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 cursor-pointer">
              <span>👨‍👩‍👧</span> Families
            </a>
            <a className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 cursor-pointer">
              <span>📝</span> Registrations
            </a>
            <a className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 cursor-pointer">
              <span>✅</span> Attendance
            </a>
          </nav>
        </div>

        {/* User + Logout */}
        <div className="p-4 border-t border-gray-700">
          <div className="text-sm mb-2">{userEmail}</div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md transition cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Camps Overview</h1>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md cursor-pointer">
            + Add New Camp
          </button>
        </div>

        {/* Placeholder until camps are fetched */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center text-gray-500 dark:text-gray-400">
          All active camp listings will appear here. Create one now.
        </div>
      </main>
    </div>
  );
}