"use client";

import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

interface UserData {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  provider?: string;
}

export default function Page() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersData: UserData[] = [];
        querySnapshot.forEach((doc) => {
          usersData.push({ id: doc.id, ...doc.data() } as UserData);
        });
        setUsers(usersData);
      } catch (error) {
        console.error("Firestore error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  return (
    <main className="min-h-screen">
      <h1 className="text-2xl font-bold text-blue-600 mb-6">Firebase Users</h1>
      {loading ? (
        <p className="text-gray-500">Loading users...</p>
      ) : users.length === 0 ? (
        <p className="text-gray-500">No users found.</p>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
            >
              <h2 className="font-semibold text-gray-800">User ID: {user.id}</h2>
              <p className="text-sm text-gray-600">
                Name: {user.firstName} {user.lastName || ""}
              </p>
              {user.displayName && (
                <p className="text-sm text-gray-600">
                  Display Name: {user.displayName}
                </p>
              )}
              <p className="text-sm text-gray-600">Email: {user.email}</p>
              {user.provider && (
                <p className="text-sm text-gray-600">Provider: {user.provider}</p>
              )}
                       </div>
          ))}
        </div>
      )}
    </main>
  );
}
