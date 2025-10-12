import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { auth, db } from "@/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { hashToken } from "../../utils/hashToken";
import { notify } from "@/components/ToastConfig";

export default function SetPasswordInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const email = decodeURIComponent(searchParams.get("email") || "");
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);

  // ✅ Verify token when page loads
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const hashed = hashToken(token);
        const q = query(
          collection(db, "users"),
          where("email", "==", email),
          where("inviteToken", "==", hashed)
        );
        const snap = await getDocs(q);

        if (snap.empty) {
          setValid(false);
          setMessage("Invalid or expired link.");
          return;
        }

        const userDoc = snap.docs[0];
        const data = userDoc.data();

        // Check expiry
        if (data.inviteExpires?.toDate() < new Date()) {
          setValid(false);
          setMessage("This link has expired. Please ask your admin for a new one.");
          return;
        }

        setValid(true);
      } catch (err) {
        console.error(err);
        setMessage("Something went wrong.");
        setValid(false);
      }
    };

    if (email && token) verifyToken();
  }, [email, token]);

  // ✅ Handle password submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      notify.error("Passwords do not match.");
      return;
    }
    setLoading(true);

    try {
      // Create Firebase Auth user
      await createUserWithEmailAndPassword(auth, email, password);

      // Mark staff as active and remove invite token
      const q = query(collection(db, "users"), where("email", "==", email));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const userRef = doc(db, "users", snap.docs[0].id);
        await updateDoc(userRef, {
          status: "Active",
          inviteToken: null,
          inviteExpires: null,
        });
      }

      // Optional: auto-login
      await signInWithEmailAndPassword(auth, email, password);
      notify.success("Account created successfully!");
      setTimeout(() => router.push("/staff/dashboard"), 1500);

    } catch (err: unknown) {
      if (err instanceof Error) {
        notify.error(err.message);
        setMessage(err.message);
      } else {
        notify.error("An unexpected error occurred.");
        setMessage("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  // UI States
  if (valid === false)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{message}</p>
      </div>
    );

  if (valid === null)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-gray-700 text-lg font-medium">Verifying link...</p>
      </div>
    );

  // ✅ Main UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-sm">
        <h1 className="text-xl font-semibold text-center text-gray-800 mb-3">
          Set Your Password
        </h1>
        <p className="text-center text-gray-500 text-sm mb-4">
          Creating account for <b>{email}</b>
        </p>

        {message && (
          <div className="bg-yellow-50 border border-yellow-300 text-yellow-700 p-2 text-sm rounded mb-3 text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-primary"
            required
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-primary"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primaryDark text-white py-3 rounded-lg text-base font-semibold flex justify-center items-center"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Setting Password...</span>
              </div>
            ) : (
              "Set Password"
            )}

          </button>
        </form>
      </div>
    </div>
  );
}