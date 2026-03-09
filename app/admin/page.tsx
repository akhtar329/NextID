"use client";

import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Building,
  MapPin,
  CalendarCheck,
  FileText,
  Users,
  Settings,
} from "lucide-react";

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

const menuItems: MenuItem[] = [
  { label: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/admin/dashboard" },
  { label: "Programs", icon: <BookOpen size={20} />, path: "/admin/programs" },
  { label: "Institutes", icon: <Building size={20} />, path: "/admin/institutes" },
  { label: "Cities", icon: <MapPin size={20} />, path: "/admin/cities" },
  { label: "Admissions", icon: <CalendarCheck size={20} />, path: "/admin/admissions" },
  { label: "Pages", icon: <FileText size={20} />, path: "/admin/pages" },
  { label: "Admin Users", icon: <Users size={20} />, path: "/admin/admin-users" },
  { label: "SEO & Settings", icon: <Settings size={20} />, path: "/admin/settings" },
];

export default function SuperAdminSidebar() {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <aside className="w-64 h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-800">
        <h1 className="text-lg font-semibold">Super Admin</h1>
        <p className="text-xs text-gray-400">Public Educational Site</p>
      </div>

      {/* Menu Items */}
      <nav className="mt-4 flex-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNavigation(item.path)}
            className="w-full flex items-center gap-3 px-6 py-3 text-sm hover:bg-gray-800 transition-colors rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1"
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer (Optional) */}
      <div className="px-6 py-4 border-t border-gray-800 text-xs text-gray-400">
        © {new Date().getFullYear()} NextID.pk
      </div>
    </aside>
  );
}
