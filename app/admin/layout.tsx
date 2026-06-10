// app/admin/layout.tsx
"use client";

import { ReactNode, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { Toaster } from "sonner";

interface AdminLayoutProps {
  children: ReactNode;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user role
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/admin/profile");
        if (response.ok) {
          const data = await response.json();
          setUser(data.profile);
          
          const isEditor = data.profile.role === "Editor";
          const restrictedForEditor = [
            "/admin/users",
            "/admin/roles",
            "/admin/settings",
            "/admin/backup",
          ];
          
          if (isEditor && restrictedForEditor.some(r => pathname?.startsWith(r))) {
            router.push("/admin/unauthorized");
          }
        } else if (response.status === 401) {
          router.push("/login");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [router, pathname]);

  useEffect(() => {
    const t = setTimeout(() => {
      setMounted(true);
      const saved = localStorage.getItem("sidebar_collapsed");
      if (saved !== null) setSidebarCollapsed(saved === "true");
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileOpen]);

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem("sidebar_collapsed", String(newState));
  };

  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen);
  };

  if (!mounted || loading) {
    return <div className="h-screen bg-gray-100 animate-pulse" />;
  }

  if (user?.role === "Editor") {
    const restrictedPaths = ["/admin/users", "/admin/roles", "/admin/settings"];
    if (restrictedPaths.some(path => pathname?.startsWith(path))) {
      return null;
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div
        className={`
          fixed lg:relative top-0 left-0 h-full z-50
          transition-all duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={toggleSidebar}
        />
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

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