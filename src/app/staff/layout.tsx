"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { signOut, User } from "firebase/auth";   // 👈 import User type
import { auth, db } from "@/firebaseConfig";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";

const menuItems = [
    { name: "Camps", path: "/staff/dashboard", icon: "🏕️" },
    { name: "Families", path: "/staff/families", icon: "👨‍👩‍👧" },
    { name: "Registrations", path: "/staff/registrations", icon: "📋" },
    { name: "Checkout Forms", path: "/staff/forms", icon: "📝" },
    { name: "Attendance", path: "/staff/attendance", icon: "✅" },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    // 👇 typed state properly
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<Record<string, any> | null>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (u) => {
            if (u) {
                setUser(u);
                const snap = await getDoc(doc(db, "users", u.uid));
                if (snap.exists()) setUserData(snap.data());
            } else {
                router.push("/staff-login");
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/staff-login");
    };

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-[#272a2b] text-white flex flex-col justify-between fixed h-full">
                <div>
                    {/* Logo */}
                    <div className="flex items-center justify-center py-6">
                        <Image
                            src="/images/bitspace-logo-green.png"
                            alt="BitSpace Logo"
                            width={160}
                            height={50}
                            priority
                        />
                    </div>

                    {/* Nav Items */}
                    <nav className="flex-1 px-4 space-y-2">
                        {menuItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.path}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-md transition ${pathname === item.path
                                    ? "bg-gray-700 text-white"
                                    : "text-gray-300 hover:bg-gray-600"
                                    }`}
                            >
                                <span>{item.icon}</span>
                                <span>{item.name}</span>
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* User info + logout */}
                {user && (
                    <div className="border-t border-gray-700 p-4">
                        <div className="flex items-center space-x-3">
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold">
                                {user.email?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-medium">
                                    {userData?.preferred_name || userData?.first_name || "Staff User"}
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
            </aside>

            {/* Main Content */}
            <div className="flex-1 ml-64 bg-gray-50">
                <main className="p-8 max-w-5xl mx-auto">{children}</main>
            </div>
        </div>
    );
}
