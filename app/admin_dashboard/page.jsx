"use client";

import { useState, useRef, useEffect } from "react";
import {
  Menu,
  Layers,
  BookOpen,
  Calendar,
  GraduationCap,
  User,
  ChevronDown,
  LogOut,
  Home,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/components/AuthProvider";

// Admin Components (ensure these paths exist)
import ManageDepartment from "@/components/AdminComponents/ManageDepartment";
import ManageCourse from "@/components/AdminComponents/ManageCourse";
import ManageSession from "@/components/AdminComponents/ManageSession";
import ManageProgram from "@/components/AdminComponents/ManageProgram";
import ManageFaculty from "@/components/AdminComponents/ManageFaculty";
import ManageCreditHours from "@/components/AdminComponents/ManageCreditHours";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const { logout, user } = useAuth();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => logout();

  const tabs = [
    { name: "Dashboard", icon: <Home className="w-4 h-4 mr-2" /> },
    { name: "Faculties", icon: <Layers className="w-4 h-4 mr-2" /> },
    { name: "Departments", icon: <Layers className="w-4 h-4 mr-2" /> },
    { name: "Programs", icon: <GraduationCap className="w-4 h-4 mr-2" /> },
    { name: "Courses", icon: <BookOpen className="w-4 h-4 mr-2" /> },
    { name: "Academic Sessions", icon: <Calendar className="w-4 h-4 mr-2" /> },
    { name: "Credit Hours", icon: <Calendar className="w-4 h-4 mr-2" /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "Faculties":
        return <ManageFaculty />;
      case "Departments":
        return <ManageDepartment />;
      case "Programs":
        return <ManageProgram />;
      case "Courses":
        return <ManageCourse />;
      case "Academic Sessions":
        return <ManageSession />;
      case "Credit Hours":
        return <ManageCreditHours />;

      default:
        return (
          <div className="p-6">
            {" "}
            <h2 className="text-2xl font-semibold">Admin Dashboard</h2>{" "}
            <p className="mt-2 text-gray-600">
              Select a section from the sidebar.
            </p>{" "}
            <p className="mt-4 text-sm text-gray-600">
              Signed in as:{" "}
              <span className="font-medium">{user?.username}</span>{" "}
            </p>{" "}
          </div>
        );
    }
  };

  return (
    <ProtectedRoute>
      {/* MOBILE NAVBAR */}{" "}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm">
        <button onClick={() => setSidebarOpen(true)}>
          {" "}
          <Menu className="w-6 h-6" />{" "}
        </button>{" "}
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>{" "}
      </div>
      <div className="flex min-h-screen">
        {/* Mobile overlay */}
        <div
          className={`fixed inset-0 bg-black/40 z-40 transition-opacity md:hidden ${
            sidebarOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 z-50 w-64 h-full bg-white border-r p-3 transform transition-transform duration-300 md:static md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Close button for mobile */}
          <div className="md:hidden flex justify-end mb-4">
            <button
              className="text-gray-600 hover:text-black"
              onClick={() => setSidebarOpen(false)}
            >
              Close ✕
            </button>
          </div>

          {tabs.map((t) => (
            <button
              key={t.name}
              onClick={() => {
                setActiveTab(t.name);
                setSidebarOpen(false);
              }}
              className={`flex items-center px-3 py-2 w-full rounded hover:bg-gray-100 ${
                activeTab === t.name ? "bg-gray-200 font-semibold" : ""
              }`}
            >
              {t.icon}
              {t.name}
            </button>
          ))}

          {/* Profile dropdown */}
          <div className="mt-auto pt-6 relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center justify-between w-full px-3 py-2 bg-gray-100 rounded"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" /> {user?.username || "Admin"}
              </div>
              <ChevronDown className="w-4 h-4" />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-2 w-full bg-white border rounded shadow-md">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 bg-gray-100 p-4 md:p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </ProtectedRoute>
  );
}
