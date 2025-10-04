"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut, User } from "firebase/auth";
import { auth, db } from "@/firebaseConfig";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import {
  HomeIcon,
  Building2Icon,
  UsersIcon,
  UserCogIcon,
  InboxIcon,
} from "lucide-react";

interface SidebarProps {
  onClose?: () => void;
}

const menuItems = [
  { name: "Home", path: "/staff/dashboard", icon: <HomeIcon className="h-5 w-5" /> },
  { name: "Facilities", path: "/staff/clinics", icon: <Building2Icon className="h-5 w-5" /> },
  { name: "Patients", path: "/staff/patients", icon: <UsersIcon className="h-5 w-5" /> },
  { name: "Staff", path: "/staff/staff-members", icon: <UserCogIcon className="h-5 w-5" /> },
  { name: "Support Tickets", path: "/staff/inbox", icon: <InboxIcon className="h-5 w-5" /> },
];

interface FirestoreUser {
  preferredName?: string;
  first_name?: string;
  email?: string;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<FirestoreUser | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (u) {
        setUser(u);
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) setUserData(snap.data() as FirestoreUser);
      } else {
        router.push("../staff-login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("../staff-login");
  };

  return (
    <div className="flex flex-col justify-between min-h-screen">
      <div>
        {/* Logo */}
        <div className="flex items-center justify-center py-6">
          <Image
            src="/images/healthlane-logo-white.png"
            alt="HealthLane Logo"
            width={180}
            height={77}
            priority
          />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-2 mt-6">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              onClick={onClose}
              className={`group flex items-center space-x-2 px-3 py-2 rounded-md transition ${
                pathname === item.path
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-600"
              }`}
            >
              <span
                className={`${
                  pathname === item.path
                    ? "text-[#00A651]"
                    : "text-gray-400 group-hover:text-white"
                } transition-colors`}
              >
                {item.icon}
              </span>
              <span className="ml-2">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* User info + logout */}
      {user && (
        <div className="mt-auto border-t border-gray-700 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">
                {userData?.preferredName || userData?.first_name || "Staff User"}
              </p>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 flex items-center space-x-2 text-gray-300 hover:text-white cursor-pointer"
          >
            <span>⇦</span>
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
