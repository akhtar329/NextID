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
  FolderTree,
  BarChart3,      // ✅ Analytics icon
  TrendingUp,     // ✅ For active visitors badge
  Newspaper,      // ✅ For News
  Award,          // ✅ For Results
} from "lucide-react";
import { useState, useEffect } from "react";

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  badge?: number | string;
  badgeColor?: string;
}

export default function SuperAdminSidebar() {
  const router = useRouter();
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
  const [activeVisitors, setActiveVisitors] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Fetch active visitors count
  useEffect(() => {
    const fetchActiveVisitors = async () => {
      try {
        const res = await fetch('/api/admin/analytics?period=today');
        const result = await res.json();
        
        if (result.success) {
          if (result.data?.overview?.activeVisitors !== undefined) {
            setActiveVisitors(result.data.overview.activeVisitors);
          }
        }
      } catch (error) {
        console.error('Error fetching active visitors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveVisitors();
    const interval = setInterval(fetchActiveVisitors, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleNavigation = (path?: string) => {
    if (path) router.push(path);
  };

  // ✅ Updated menuItems with Analytics
  const menuItems: MenuItem[] = [
    { label: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/admin/dashboard" },
    
    // ✅ NEW - Analytics Menu Item
    { 
      label: "Analytics", 
      icon: <BarChart3 size={20} />, 
      path: "/admin/analytics",
      badge: activeVisitors > 0 ? activeVisitors : undefined,
      badgeColor: "bg-green-500",
    },

    // Academics
    {
      label: "Academics",
      icon: <BookOpen size={20} />,
      children: [
        { label: "Programs", icon: <Book size={18} />, path: "/admin/programs" },
        { label: "Degrees", icon: <Layers size={18} />, path: "/admin/degrees" },
        { label: "Categories", icon: <FolderTree size={18} />, path: "/admin/categories" },
        { label: "Levels", icon: <Layers size={18} />, path: "/admin/levels" },
      ],
    },

    // Institutes & Boards
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
    { label: "Results", icon: <Award size={20} />, path: "/admin/results" },
    { label: "News", icon: <Newspaper size={20} />, path: "/admin/news" },

    // Admin Management
    {
      label: "Admin Management",
      icon: <Users size={20} />,
      children: [
        { label: "Admin Users", icon: <Users size={18} />, path: "/admin/admin-users" },
        { label: "Admin Roles", icon: <Settings size={18} />, path: "/admin/admin-roles" },
      ],
    },

    // SEO & Settings
    { 
      label: "SEO & Settings", 
      icon: <Settings size={20} />,
      children: [
        { label: "SEO Settings", icon: <Settings size={18} />, path: "/admin/seo-settings" },
        { label: "General Settings", icon: <Search size={18} />, path: "/admin/general-settings" },
        { label: "Social & Contact", icon: <Cog size={18} />, path: "/admin/social-contact" },
        { label: "Advanced Settings", icon: <Shield size={18} />, path: "/admin/advanced-settings" },
      ]
    },
  ];

  return (
    <aside className="w-64 h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-800">
        <h1 className="text-lg font-semibold">Super Admin</h1>
        <p className="text-xs text-gray-400">Public Educational Site</p>
      </div>

      {/* Live Visitors Badge */}
      {activeVisitors > 0 && (
        <div className="mx-4 mt-3 p-2 bg-gray-800 rounded-lg flex items-center gap-2">
          <TrendingUp size={16} className="text-green-400" />
          <span className="text-xs text-gray-300">
            <span className="font-bold text-green-400">{activeVisitors}</span> active visitors
          </span>
        </div>
      )}

      {/* Menu Items */}
      <nav className="mt-4 flex-1 overflow-y-auto">
        {menuItems.map((item) => (
          <div key={item.label}>
            <button
              onClick={() => (item.children ? toggleMenu(item.label) : handleNavigation(item.path))}
              className="w-full flex items-center justify-between gap-3 px-6 py-3 text-sm hover:bg-gray-800 transition-colors rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1 group"
            >
              <div className="flex items-center gap-3">
                <span className="text-gray-400 group-hover:text-white transition-colors">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              
              {/* Badge for active visitors */}
              {item.badge && (
                <span className={`${item.badgeColor || 'bg-blue-500'} text-white text-xs px-2 py-0.5 rounded-full animate-pulse`}>
                  {item.badge}
                </span>
              )}
              
              {/* Dropdown arrow for items with children */}
              {item.children && (
                <span className="text-gray-400 text-xs">
                  {openMenus[item.label] ? '▼' : '▶'}
                </span>
              )}
            </button>

            {/* Sub-menu */}
            {item.children && openMenus[item.label] && (
              <div className="ml-6 mt-1 space-y-1 border-l border-gray-700 pl-2">
                {item.children.map((child) => (
                  <button
                    key={child.label}
                    onClick={() => handleNavigation(child.path)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <span className="text-gray-500">{child.icon}</span>
                    <span>{child.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer with Live Indicator */}
      <div className="px-6 py-4 border-t border-gray-800 text-xs text-gray-400">
        <div className="flex items-center justify-between">
          <span>© {new Date().getFullYear()} NextID.pk</span>
          <div className="flex items-center gap-1">
            {loading ? (
              <span className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></span>
            ) : (
              <span className={`w-2 h-2 ${activeVisitors > 0 ? 'bg-green-500' : 'bg-gray-600'} rounded-full`}></span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}