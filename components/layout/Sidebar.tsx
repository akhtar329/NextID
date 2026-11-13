
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
  userRole?: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  divider?: boolean;
}

const APP_VERSION = "0.1.1";

const adminNavItems: NavItem[] = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },

  { name: "Content", href: "#", icon: FileEdit, divider: true },
  { name: "All Posts", href: "/admin/post", icon: List },
  { name: "Create Post", href: "/admin/post/create", icon: PlusCircle },
  { name: "Media", href: "/admin/media", icon: Image },
  { name: "Categories", href: "/admin/categories", icon: FolderTree },
  { name: "Tags", href: "/admin/tags", icon: Tag },

  { name: "System", href: "#", icon: Settings, divider: true },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Settings", href: "/admin/settings", icon: Settings },
  { name: "Maintenance", href: "/admin/settings/maintenance", icon: Wrench },
  { name: "SEO Redirects", href: "/admin/settings/redirects", icon: RefreshCw },
  { name: "Performance Logs", href: "/admin/logs", icon: RefreshCw },
];

const editorNavItems: NavItem[] = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },

  { name: "Content", href: "#", icon: FileEdit, divider: true },
  { name: "All Posts", href: "/admin/post", icon: List },
  { name: "Create Post", href: "/admin/post/create", icon: PlusCircle },
  { name: "Media", href: "/admin/media", icon: Image },
  { name: "Categories", href: "/admin/categories", icon: FolderTree },
  { name: "Tags", href: "/admin/tags", icon: Tag },
];

export default function Sidebar({
  collapsed,
  onToggle,
  userRole = "Admin",
}: SidebarProps) {
  const pathname = usePathname();

  const isEditor = userRole.toLowerCase() === "editor";
  const navItems = isEditor ? editorNavItems : adminNavItems;

  const isActive = (href: string): boolean => {
    if (href === "#") return false;

    if (href === "/admin") {
      return pathname === "/admin";
    }

    if (href === "/admin/post") {
      return (
        pathname === "/admin/post" ||
        pathname.startsWith("/admin/post/")
      );
    }

    if (href === "/admin/settings") {
      return (
        pathname === "/admin/settings" ||
        pathname.startsWith("/admin/settings/")
      );
    }

    if (href === "/admin/media") {
      return (
        pathname === "/admin/media" ||
        pathname.startsWith("/admin/media/")
      );
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside
      className={`
        h-full bg-white border-r border-gray-200
        flex flex-col transition-all duration-300
        ${collapsed ? "w-16" : "w-64"}
      `}
    >
      {/* Logo */}
      <div className={`border-b border-gray-100 ${collapsed ? "py-3" : "p-4"}`}>
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            aria-label="NextID Admin Dashboard"
            className={`flex items-center gap-2 ${
              collapsed ? "justify-center w-full" : ""
            }`}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-white font-bold">ID</span>
            </div>

            {!collapsed && (
              <div className="overflow-hidden">
                <span className="font-bold text-lg text-gray-800 block leading-tight">
                  NextID
                </span>
                <span className="text-xs text-gray-400">
                  Admin Panel
                </span>
              </div>
            )}
          </Link>

          {!collapsed && (
            <button
              type="button"
              onClick={onToggle}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>

        {collapsed && (
          <div className="flex justify-center mt-2">
            <button
              type="button"
              onClick={onToggle}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        aria-label="Admin navigation"
        className="flex-1 py-4 overflow-y-auto"
      >
        <div className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            if (item.divider) {
              return (
                <div
                  key={item.name}
                  className={
                    collapsed
                      ? "border-t border-gray-100 my-3"
                      : "pt-3 mt-3 first:pt-0"
                  }
                  aria-hidden="true"
                >
                  {!collapsed && (
                    <div className="px-3 py-1">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {item.name}
                      </span>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.name : undefined}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-colors duration-200
                  ${collapsed ? "justify-center" : ""}
                  ${
                    active
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }
                `}
              >
                <Icon size={20} className="shrink-0" />

                {!collapsed && (
                  <span className="text-sm whitespace-nowrap">
                    {item.name}
                  </span>
                )}

                {active && !collapsed && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      {collapsed ? (
        <div className="p-2 border-t border-gray-100">
          <div className="flex justify-center">
            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-xs text-gray-500">
                {isEditor ? "E" : "A"}
              </span>
            </div>
          </div>

          <div className="text-center mt-1">
            <span className="text-[10px] text-gray-400">
              v{APP_VERSION}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t border-gray-100">
          <p className="text-xs text-center text-gray-400">
            NextID Admin Panel
          </p>
          <p className="text-xs text-center text-gray-400 mt-1">
            Version {APP_VERSION}
          </p>
        </div>
      )}
    </aside>
  );
}
