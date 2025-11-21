// app/admin_login/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import toast, { Toaster } from "react-hot-toast";
import ITEMSApi, { saveAuth } from "@/lib/api";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    const toastId = toast.loading("Logging in...");

    try {
      // call backend
      const response = await ITEMSApi.login({ usernameOrEmail: username, password });

      if (!response?.token) {
        toast.error("❌ Invalid username or password", { id: toastId });
        setSubmitting(false);
        return;
      }

      // roles array from backend
      const roles = Array.isArray(response.roles) ? response.roles : [];

      const isAdmin = roles.includes("ADMIN");
      const isSuperAdmin = roles.includes("SUPERADMIN");

      if (!isAdmin && !isSuperAdmin) {
        toast.error("❌ Access denied: Only ADMIN or SUPERADMIN can login here", { id: toastId });
        setSubmitting(false);
        return;
      }

      const user = {
        id: response.identifier || response.id || null,
        username: response.username,
        roles,
      };

      // persist to localStorage and set axios header
      saveAuth(response.token, user);
      login(response.token, user);

      toast.success(`🎉 Welcome back, ${user.username}!`, { id: toastId, duration: 2000 });

      // redirect by role
      setTimeout(() => {
        if (isSuperAdmin) router.push("/super_admin_dashboard");
        else router.push("/admin_dashboard");
      }, 600);
    } catch (err) {
      console.error("Admin login error:", err);
      const message =
        err.response?.data?.message ||
        (typeof err.response?.data === "string" ? err.response.data : "An unexpected error occurred.");
      toast.error("❌ " + message, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-6">👑 Admin Login</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username or Email</label>
            <input
              className="w-full p-3 border rounded focus:outline-none focus:ring focus:ring-blue-200 sm:text-base"
              placeholder="Enter your username or email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              className="w-full p-3 border rounded focus:outline-none focus:ring focus:ring-blue-200 sm:text-base"
              placeholder="Enter your password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3 text-white rounded transition text-lg sm:text-base ${
              submitting ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {submitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Only users with <span className="font-medium">ADMIN</span> or{" "}
          <span className="font-medium">SUPERADMIN</span> roles can login here.
        </p>
      </div>
    </div>
  );
}
