
"use client";

import {
  Menu,
  Bell,
  ChevronDown,
  UserCircle,
  Settings,
  LogOut,
} from "lucide-react";
import { usePathname } from "next/navigation";

interface OwnerTopbarProps {
  onMenuClick: () => void;
  ownerName?: string;
  ownerEmail?: string;
}

const pageNames: Record<string, string> = {
  "/owner": "Dashboard",
  "/admin/institute/users/institutes": "My Institutes",
  "/admin/institute/users/students": "Students",
  "/admin/institute/users/teachers": "Teachers",
  "/admin/institute/users/staff": "Staff",
  "/admin/institute/users/classes": "Classes",
  "/admin/institute/users/attendance": "Attendance",
  "/admin/institute/users/fees": "Fee Management",
  "/admin/institute/users/events": "Activities & Events",
  "/admin/institute/users/settings": "Settings",
};

export default function OwnerTopbar({
  onMenuClick,
  ownerName = "Institute Owner",
  ownerEmail = "",
}: OwnerTopbarProps) {
  const pathname = usePathname();

  const pageTitle =
    pageNames[pathname] ||
    Object.keys(pageNames)
      .filter((path) => path !== "/owner")
      .sort((a, b) => b.length - a.length)
      .find((path) => pathname.startsWith(path))?.split("/").pop()
      ?.replace(/-/g, " ")
      ?.replace(/\b\w/g, (char) => char.toUpperCase()) ||
    "Owner Portal";

  return (
    <header className="h-[76px] shrink-0 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between">

      {/* LEFT */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          aria-label="Open navigation"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 capitalize">
            {pageTitle}
          </h2>
          <p className="hidden sm:block text-xs text-gray-400 mt-0.5">
            Manage your institute from one place
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3 sm:gap-5">
        <button
          className="relative p-2.5 rounded-xl hover:bg-gray-100 text-gray-500"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
        </button>

        <div className="h-9 w-px bg-gray-200 hidden sm:block" />

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold text-gray-800">
              {ownerName}
            </p>
            <p className="text-xs text-gray-400">
              {ownerEmail || "Institute Owner"}
            </p>
          </div>

          <button
            className="flex items-center gap-2"
            aria-label="Owner profile"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              {ownerName.charAt(0).toUpperCase()}
            </div>
            <ChevronDown className="hidden sm:block w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
