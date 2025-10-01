"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/staff/staff-login");
      } else if (role !== "staff" && role !== "admin") {
        router.push("/"); // kick out non-staff
      }
    }
  }, [user, role, loading, router]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center text-2xl font-bold">
      Staff Dashboard (Hello {user?.email})

      <button
      onClick={logout}
      className="bg-red-600 text-white px-4 py-2 rounded"
    >
      Log Out
    </button>
    </div>
    
  );
}