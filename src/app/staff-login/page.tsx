"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "@/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function StaffLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const userCred = await signInWithEmailAndPassword(auth, email, password);
            const uid = userCred.user.uid;

            // Fetch role from Firestore
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.role === "staff" || userData.role === "admin") {
                    router.push("/staff/dashboard");
                } else if (userData.role === "parent") {
                    router.push("/parent/dashboard");
                } else {
                    setError("Access denied. This account is not a staff user.");
                }
            } else {
                setError("User record not found in database.");
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unknown error occurred");
            }
        }
    };

    // Forgot password handler
    const handleForgotPassword = async () => {
        if (!email) {
            setError("Please enter your email first.");
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            alert("Password reset email sent! Please check your inbox.");
        } catch (err) {
            console.error(err);
            setError("Failed to send reset email. Please check the email entered.");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <Image
                        src="/images/healthlane-logo-colored.png"
                        alt="HealthLane logo"
                        width={200}
                        height={86}
                        priority
                    />
                </div>

                <h1 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
                    Staff Login
                </h1>

                {error && (
                    <div className="mb-4 text-red-600 dark:text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md 
                                bg-white dark:bg-gray-700 
                                border-gray-300 dark:border-gray-600 
                                text-gray-900 dark:text-white"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md 
                                bg-white dark:bg-gray-700 
                                border-gray-300 dark:border-gray-600 
                                text-gray-900 dark:text-white"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-green-700 hover:bg-green-800 text-white py-2 rounded-md transition cursor-pointer"
                    >
                        Log In
                    </button>
                </form>

                {/* Forgot password link */}
                <div className="mt-4 text-sm text-center">
                    <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-green-700 dark:text-green-400 underline cursor-pointer"
                    >
                        Forgot password?
                    </button>
                </div>
            </div>
        </div>
    );
}