// app/users/owner/institute/layout.tsx

"use client";

import { ReactNode, useState, useEffect, useSyncExternalStore } from "react";
import Sidebar from "@/components/owner/layout/OwnerSidebar";
import Topbar from "@/components/owner/layout/OwnerTopbar";
import { Toaster } from "sonner";

interface AdminLayoutProps {
  children: ReactNode;
}

// ============================================================
// ✅ SIDEBAR STATE (SSR-safe)
// ============================================================

const subscribeToSidebar = (callback: () => void) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("sidebar-collapsed", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("sidebar-collapsed", callback);
    window.removeEventListener("storage", callback);
  };
};

let cachedSnapshot = false;

const getSidebarSnapshot = () => {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem("sidebar_collapsed") === "true";
  if (stored !== cachedSnapshot) {
    cachedSnapshot = stored;
  }
  return cachedSnapshot;
};

const getSidebarServerSnapshot = () => false;

// ============================================================
// ✅ LAYOUT COMPONENT — NO mounted state
// ============================================================

export default function AdminLayout({ children }: AdminLayoutProps) {
  const sidebarCollapsed = useSyncExternalStore(
    subscribeToSidebar,
    getSidebarSnapshot,
    getSidebarServerSnapshot
  );

  const [mobileOpen, setMobileOpen] = useState(false);

  // ✅ Only resize listener — NO setState in effect body
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    const newValue = !sidebarCollapsed;
    localStorage.setItem("sidebar_collapsed", String(newValue));
    window.dispatchEvent(new Event("sidebar-collapsed"));
  };

  const toggleMobileSidebar = () => {
    setMobileOpen((prev) => !prev);
  };

  // ✅ NO mounted check — always render real layout
  // Server: sidebarCollapsed = false
  // Client: sidebarCollapsed = real value (useSyncExternalStore handles hydration)
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`
          fixed lg:relative top-0 left-0 h-full z-50
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
        />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onMenuClick={toggleMobileSidebar} />

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
}