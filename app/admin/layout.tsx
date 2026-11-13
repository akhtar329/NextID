
"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { Toaster } from "sonner";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Restore sidebar preference after hydration.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar_collapsed");

      if (saved !== null) {
        setSidebarCollapsed(saved === "true");
      }
    } catch (error) {
      console.error("Unable to restore sidebar preference:", error);
    }
  }, []);

  // Close mobile sidebar when switching to desktop.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((previous) => {
      const next = !previous;

      try {
        localStorage.setItem("sidebar_collapsed", String(next));
      } catch (error) {
        console.error("Unable to save sidebar preference:", error);
      }

      return next;
    });
  };

  const toggleMobileSidebar = () => {
    setMobileOpen((previous) => !previous);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`
          fixed lg:relative top-0 left-0 h-full z-50
          transition-transform duration-300 ease-in-out
          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
        />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 bg-black/50 z-40 lg:hidden cursor-default"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <Topbar onMenuClick={toggleMobileSidebar} />

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
}
