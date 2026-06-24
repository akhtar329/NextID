"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  FileEdit,
  List,
  PlusCircle,
  Settings,
  Users,
  RefreshCw,
  Wrench,
  Image,
  FolderTree,
  Tag,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  userRole?: string;  // ✅ New prop for role-based menu
}

// ✅ Admin ke liye full menu items
const adminNavItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  
  // ==================== POSTS SECTION ====================
  { name: "Content", href: "#", icon: FileEdit, divider: true },
  { name: "All Posts", href: "/admin/post", icon: List },
  { name: "Create Post", href: "/admin/post/create", icon: PlusCircle },
  { name: "Media", href: "/admin/media", icon: Image },
  { name: "Categories", href: "/admin/categories", icon: FolderTree },
  { name: "Tags", href: "/admin/tags", icon: Tag },
  
  // ==================== SYSTEM ====================
  { name: "System", href: "#", icon: Settings, divider: true },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Settings", href: "/admin/settings", icon: Settings },
  { name: "Maintenance", href: "/admin/settings/maintenance", icon: Wrench },
  { name: "SEO Redirects", href: "/admin/settings/redirects", icon: RefreshCw },
];

// ✅ Editor ke liye limited menu items (no users, no settings)
const editorNavItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  
  // ==================== POSTS SECTION ====================
  { name: "Content", href: "#", icon: FileEdit, divider: true },
  { name: "All Posts", href: "/admin/post", icon: List },
  { name: "Create Post", href: "/admin/post/create", icon: PlusCircle },
  { name: "Media", href: "/admin/media", icon: Image },
  { name: "Categories", href: "/admin/categories", icon: FolderTree },
  { name: "Tags", href: "/admin/tags", icon: Tag },
  
  // ==================== SYSTEM (Limited) ====================
  // ❌ No Users, No Settings, No Maintenance for Editor
];

export default function Sidebar({ collapsed, onToggle, userRole = "Admin" }: SidebarProps) {
  const pathname = usePathname();
  
  // ✅ Choose menu based on role
  const isEditor = userRole === "Editor";
  const navItems = isEditor ? editorNavItems : adminNavItems;

  const isActive = (href: string) => {
    if (href === "#") return false;
    if (href === "/admin") return pathname === "/admin";
    if (href === "/admin/post") {
      return pathname === "/admin/post" || pathname.startsWith("/admin/post/");
    }
    if (href === "/admin/settings") {
      return pathname === "/admin/settings" || 
             pathname === "/admin/settings/maintenance" || 
             pathname === "/admin/settings/redirects";
    }
    if (href === "/admin/media") {
      return pathname === "/admin/media" || pathname.startsWith("/admin/media/");
    }
    if (href === "/admin/categories") {
      return pathname === "/admin/categories";
    }
    if (href === "/admin/tags") {
      return pathname === "/admin/tags";
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
              <span className="text-white font-bold">ID</span>
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <span className="font-bold text-lg text-gray-800 block leading-tight">NextID</span>
                <span className="text-xs text-gray-400">Admin Panel</span>
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
            
            // Divider for section headers
            if (item.divider && !collapsed) {
              return (
                <div key={item.name} className="pt-2 mt-2 first:pt-0">
                  <div className="px-3 py-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {item.name}
                    </span>
                  </div>
                </div>
              );
            }
            
            // Divider when collapsed (just a separator)
            if (item.divider && collapsed) {
              return (
                <div key={item.name} className="border-t border-gray-100 my-2"></div>
              );
            }
            
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
                {active && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer Info with Role Badge */}
      {!collapsed ? (
        <div className="p-4 border-t border-gray-100">
          <div className={`text-xs text-center ${isEditor ? "text-orange-600" : "text-gray-400"}`}>
            <p>NextID Admin Panel</p>
            <div className={`mt-2 px-2 py-1 rounded-lg ${isEditor ? "bg-orange-50" : "bg-gray-50"}`}>
              <span className={`text-xs font-medium ${isEditor ? "text-orange-600" : "text-gray-500"}`}>
                Role: {userRole}
              </span>
            </div>
            <p className="mt-1 text-gray-400">Version 1.0.0</p>
          </div>
        </div>
      ) : (
        <div className="p-2 border-t border-gray-100">
          <div className="flex justify-center">
            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-xs text-gray-500">{userRole === "Editor" ? "E" : "A"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}