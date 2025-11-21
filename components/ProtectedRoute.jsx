// components/ProtectedRoute.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, authReady } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!authReady) return;

    if (!isAuthenticated) {
      // Immediately send to landing (or /login if you prefer)
      router.replace("/");
    } else {
      setChecking(false);
    }
  }, [authReady, isAuthenticated, router]);

  if (checking || !authReady) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600 animate-pulse">
        Checking session...
      </div>
    );
  }

  return children;
}
