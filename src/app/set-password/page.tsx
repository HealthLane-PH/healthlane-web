"use client";

import { Suspense } from "react";
import SetPasswordInner from "./SetPasswordInner";

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-600">
          Loading...
        </div>
      }
    >
      <SetPasswordInner />
    </Suspense>
  );
}