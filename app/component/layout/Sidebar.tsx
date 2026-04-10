// app/component/layout/Sidebar.tsx
"use client";

import { ReactNode } from "react";
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
  TrendingUp,
  Award,
  BookOpen,
  School,
  BarChart3,
  Megaphone,
  MessageSquare,
  HelpCircle,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: ReactNode;
  badge?: number;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/admin", icon: <LayoutDashboard size={20} /> },
  { name: "Analytics", href: "/admin/analytics", icon: <BarChart3 size={20} /> },
  { name: "News", href: "/admin/news", icon: <Newspaper size={20} /> },
  { name: "Admissions", href: "/admin/admissions", icon: <GraduationCap size={20} /> },
  { name: "Results", href: "/admin/results", icon: <FileText size={20} /> },
  { name: "Date Sheets", href: "/admin/date-sheets", icon: <Calendar size={20} /> },
  { name: "Institutes", href: "/admin/institutes", icon: <Building2 size={20} /> },
  { name: "Programs", href: "/admin/programs", icon: <BookOpen size={20} /> },
  { name: "Boards", href: "/admin/boards", icon: <Award size={20} /> },
  { name: "Cities", href: "/admin/cities", icon: <MapPin size={20} /> },
  { name: "Scholarships", href: "/admin/scholarships", icon: <Award size={20} /> },
  { name: "Users", href: "/admin/users", icon: <Users size={20} /> },
  { name: "Settings", href: "/admin/settings", icon: <Settings size={20} /> },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Logo Section */}
      <div className={`h-16 flex items-center ${collapsed ? 'justify-center' : 'px-6'} border-b border-gray-200 bg-white`}>
        {!collapsed ? (
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              NextID
            </span>
            <span className="text-xs text-gray-400 ml-1">Admin</span>
          </Link>
        ) : (
          <Link href="/admin">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                ${isActive(item.href) 
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-l-4 border-blue-600" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }
                ${collapsed ? "justify-center" : ""}
              `}
              title={collapsed ? item.name : undefined}
            >
              <div className={`
                ${isActive(item.href) ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"}
                ${collapsed ? "scale-110" : ""}
              `}>
                {item.icon}
              </div>
              {!collapsed && (
                <span className="text-sm font-medium flex-1">{item.name}</span>
              )}
              {!collapsed && item.badge && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* Footer Section */}
      <div className="border-t border-gray-200 p-3">
        <button
          onClick={onToggle}
          className={`
            w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all
            ${collapsed ? "justify-center" : ""}
          `}
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span className="text-sm">Collapse Menu</span>}
        </button>
      </div>
    </div>
  );
}