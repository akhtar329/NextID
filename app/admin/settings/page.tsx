// app/admin/settings/page.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Shield, 
  Globe, 
  Users, 
  Bell, 
  Database, 
  Share2, 
  Wrench,
  LayoutDashboard,
  Settings as SettingsIcon
} from "lucide-react";

const settingsTabs = [
  { id: "general", name: "General", icon: Globe, href: "/admin/settings" },
  { id: "maintenance", name: "Maintenance", icon: Wrench, href: "/admin/settings/maintenance" },
  { id: "seo", name: "SEO", icon: Share2, href: "/admin/settings/seo" },
  { id: "users", name: "User Management", icon: Users, href: "/admin/settings/users" },
  { id: "notifications", name: "Notifications", icon: Bell, href: "/admin/settings/notifications" },
  { id: "backup", name: "Backup", icon: Database, href: "/admin/settings/backup" },
  { id: "security", name: "Security", icon: Shield, href: "/admin/settings/security" },
];

export default function SettingsPage() {
  const pathname = usePathname();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-gray-700" />
          Settings
        </h1>
        <p className="text-gray-500 mt-1">Manage your site configuration and preferences</p>
      </div>

      {/* Settings Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1 overflow-x-auto">
          {settingsTabs.map((tab) => {
            const isActive = pathname === tab.href || 
              (tab.id === "general" && pathname === "/admin/settings");
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all ${
                  isActive
                    ? "bg-white text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* General Settings Content */}
      <div className="space-y-6">
        {/* Site Settings Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900">General Settings</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Name
              </label>
              <input
                type="text"
                defaultValue="NextID.pk"
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Description
              </label>
              <textarea
                rows={3}
                defaultValue="Pakistan's leading education portal for admissions, results, and educational news."
                className="w-full max-w-2xl px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                defaultValue="info@nextid.pk"
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}