"use client";

import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Book,
  Layers,
  Building,
  MapPin,
  CalendarCheck,
  FileText,
  Users,
  Settings,
  Search,
  Cog,
  Shield,
  FolderTree, // Added for Categories
} from "lucide-react";
import { useState } from "react";

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { label: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/admin/dashboard" },

  // Main Programs renamed to Academics
  {
    label: "Academics",
    icon: <BookOpen size={20} />,
    children: [
      { label: "Programs", icon: <Book size={18} />, path: "/admin/programs" },
      { label: "Degrees", icon: <Layers size={18} />, path: "/admin/degrees" },
      { label: "Categories", icon: <FolderTree size={18} />, path: "/admin/categories" }, // ADDED CATEGORIES HERE
      { label: "Levels", icon: <Layers size={18} />, path: "/admin/levels" },
    ],
  },

  // Institutes dropdown
  {
    label: "Institutes & Boards",
    icon: <Building size={20} />,
    children: [
      { label: "Institutes", icon: <Building size={18} />, path: "/admin/institutes" },
      { label: "Boards", icon: <Layers size={18} />, path: "/admin/boards" },
    ],
  },

  { label: "Cities", icon: <MapPin size={20} />, path: "/admin/cities" },
  { label: "Admissions", icon: <CalendarCheck size={20} />, path: "/admin/admissions" },
  { label: "Results", icon: <FileText size={20} />, path: "/admin/results" },
  { label: "News Update", icon: <FileText size={20} />, path: "/admin/news" },

  // Admin Users with Roles
  {
    label: "Admin Management",
    icon: <Users size={20} />,
    children: [
      { label: "Admin Users", icon: <Users size={18} />, path: "/admin/admin-users" },
      { label: "Admin Roles", icon: <Settings size={18} />, path: "/admin/admin-roles" },
    ],
  },
  

  { label: "SEO & Settings", 
    icon: <Settings size={20} />,
    children:[
      { label: "SEO Settings", icon: <Settings size={18} />, path: "/admin/seo-settings" },
      { label: "General Settings", icon: <Search size={18} />, path: "/admin/general-settings" },
      { label: "Social & Contact", icon: <Cog size={18} />, path: "/admin/social-contact" },
      { label: "Advanced Settings", icon: <Shield size={18} />, path: "/admin/advanced-settings" },
    ]
  },
];

export default function SuperAdminSidebar() {
  const router = useRouter();
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleNavigation = (path?: string) => {
    if (path) router.push(path);
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
          <div key={item.label}>
            <button
              onClick={() => (item.children ? toggleMenu(item.label) : handleNavigation(item.path))}
              className="w-full flex items-center gap-3 px-6 py-3 text-sm hover:bg-gray-800 transition-colors rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>

            {/* Sub-menu */}
            {item.children && openMenus[item.label] && (
              <div className="ml-6 mt-1 space-y-1">
                {item.children.map((child) => (
                  <button
                    key={child.label}
                    onClick={() => handleNavigation(child.path)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-800 transition-colors rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {child.icon}
                    <span>{child.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-800 text-xs text-gray-400">
        © {new Date().getFullYear()} NextID.pk
      </div>
    </aside>
  );
}