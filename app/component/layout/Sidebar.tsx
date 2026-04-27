// app/component/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Newspaper,
  GraduationCap,
  Building2,
  MapPin,
  Calendar,
  FileText,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Award,
  BookOpen,
  Wrench,
  RefreshCw,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "News", href: "/admin/news", icon: Newspaper },
  { name: "Admissions", href: "/admin/admissions", icon: GraduationCap },
  { name: "Results", href: "/admin/results", icon: FileText },
  { name: "Date Sheets", href: "/admin/date-sheets", icon: Calendar },
  { name: "Institutes", href: "/admin/institutes", icon: Building2 },
  { name: "Programs", href: "/admin/programs", icon: BookOpen },
  { name: "Boards", href: "/admin/boards", icon: Award },
  { name: "Cities", href: "/admin/cities", icon: MapPin },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Settings", href: "/admin/settings", icon: Settings },
  { name: "Maintenance", href: "/admin/settings/maintenance", icon: Wrench },
  { name: "SEO Redirects", href: "/admin/settings/redirects", icon: RefreshCw },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    if (href === "/admin/settings") {
      return pathname === "/admin/settings" || pathname === "/admin/settings/maintenance" || pathname === "/admin/settings/redirects";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className={`h-full bg-white border-r flex flex-col transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}>
      
      {/* Logo Section + Collapse Button */}
      <div className={`border-b ${collapsed ? "py-3" : "p-4"}`}>
        <div className="flex items-center justify-between">
          <Link href="/admin" className={`flex items-center gap-2 ${collapsed ? "justify-center w-full" : ""}`}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold">N</span>
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <span className="font-bold text-lg text-gray-800 block leading-tight">NextID</span>
                <span className="text-xs text-gray-400">Admin</span>
              </div>
            )}
          </Link>
          
          {!collapsed && (
            <button
              onClick={onToggle}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all"
              title="Collapse"
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>
        
        {collapsed && (
          <div className="flex justify-center mt-2">
            <button
              onClick={onToggle}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all"
              title="Expand"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg transition-all
                  ${collapsed ? "justify-center" : ""}
                  ${active 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-gray-600 hover:bg-gray-100"}
                `}
                title={collapsed ? item.name : undefined}
              >
                <Icon size={20} className="shrink-0" />
                {!collapsed && <span className="text-sm whitespace-nowrap">{item.name}</span>}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}