"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "@/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react"; // 👈 Add this to your import list (top of file)


export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    setLoading(true);

    try {
      // ✅ 1. Firebase Auth login
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      // ✅ 2. Query Firestore by email (not UID)
      const q = query(collection(db, "users"), where("email", "==", email));
      const querySnap = await getDocs(q);

      if (!querySnap.empty) {
        const userData = querySnap.docs[0].data();

        // ✅ 3. Role-based redirect
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
      if (err instanceof Error) setError(err.message);
      else setError("An unknown error occurred.");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return setError("Please enter your email first.");
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent! Please check your inbox.");
    } catch (err) {
      console.error(err);
      setError("Failed to send reset email. Please check the email entered.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 sm:p-8">
        <div className="flex justify-center mb-6">
          <Image
            src="/images/healthlane-logo-colored.png"
            alt="HealthLane logo"
            width={180}
            height={70}
            priority
          />
        </div>

        <h1 className="text-xl sm:text-2xl font-semibold text-center mb-6 text-gray-900 dark:text-white">
          Staff Login
        </h1>

        {error && (
          <div className="mb-4 text-red-600 dark:text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm 
                         bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 
                         text-gray-900 dark:text-white focus:ring-2 focus:ring-green-600 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm 
                         bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 
                         text-gray-900 dark:text-white focus:ring-2 focus:ring-green-600 outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm sm:text-base font-medium transition ${loading
                ? "bg-[#1bae69]/70 cursor-not-allowed"
                : "bg-[#1bae69] hover:bg-[#169a5f]"
              } text-white`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin w-5 h-5" />
                Logging in…
              </>
            ) : (
              "Log In"
            )}
          </button>

        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-green-700 dark:text-green-400 text-sm underline"
          >
            Forgot password?
          </button>
        </div>
      </div>
    </div>
  );
}