"use client";

import { useState, useEffect } from "react";
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
  BarChart3,      // ✅ Analytics icon
  TrendingUp,     // ✅ For active visitors
} from "lucide-react";

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number | string;  // ✅ For showing counts
  badgeColor?: string;
}

export default function SuperAdminSidebar() {
  const router = useRouter();
  const [activeVisitors, setActiveVisitors] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Fetch active visitors count
  useEffect(() => {
    const fetchActiveVisitors = async () => {
      try {
        const res = await fetch('/api/admin/analytics?period=today');
        const data = await res.json();
        if (data.success) {
          setActiveVisitors(data.data.overview.activeVisitors);
        }
      } catch (error) {
        console.error('Error fetching active visitors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveVisitors();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchActiveVisitors, 30000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Updated menuItems with Analytics
  const menuItems: MenuItem[] = [
    { label: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/admin/dashboard" },
    { label: "Programs", icon: <BookOpen size={20} />, path: "/admin/programs" },
    { label: "Institutes", icon: <Building size={20} />, path: "/admin/institutes" },
    { label: "Cities", icon: <MapPin size={20} />, path: "/admin/cities" },
    { label: "Admissions", icon: <CalendarCheck size={20} />, path: "/admin/admissions" },
    
    // ✅ NEW - Analytics Menu Item
    { 
      label: "Analytics", 
      icon: <BarChart3 size={20} />, 
      path: "/admin/analytics",
      badge: activeVisitors > 0 ? activeVisitors : undefined,
      badgeColor: "bg-green-500",
    },
    
    { label: "Pages", icon: <FileText size={20} />, path: "/admin/pages" },
    { label: "Admin Users", icon: <Users size={20} />, path: "/admin/admin-users" },
    { label: "SEO & Settings", icon: <Settings size={20} />, path: "/admin/settings" },
  ];

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

      {/* Live Visitors Badge (Optional) */}
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
          <button
            key={item.path}
            onClick={() => handleNavigation(item.path)}
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
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-800 text-xs text-gray-400">
        <div className="flex items-center justify-between">
          <span>© {new Date().getFullYear()} NextID.pk</span>
          {loading ? (
            <span className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></span>
          ) : (
            <span className={`w-2 h-2 ${activeVisitors > 0 ? 'bg-green-500' : 'bg-gray-600'} rounded-full`}></span>
          )}
        </div>
      </div>
    </aside>
  );
}