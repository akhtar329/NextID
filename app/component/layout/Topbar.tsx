"use client";

import { Menu, Bell, User } from "lucide-react";
import { useState } from "react";

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="bg-white border-b h-16 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold">Admin Panel</h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg hover:bg-gray-100 relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <span className="hidden md:block text-sm">Admin</span>
          </button>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
                  Profile
                </button>
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
                  Settings
                </button>
                <hr />
                <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}