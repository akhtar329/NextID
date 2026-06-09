"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  CalendarCheck,
  Award,
  Newspaper,
  Building,
  BookOpen,
  MapPin,
  ArrowUp,
  TrendingUp,
  PlusCircle,
  FileText,
  Image,
  FolderTree,
  Tag,
} from "lucide-react";
import Link from "next/link";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

export default function AdminDashboard() {
  const router = useRouter();
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
  }, [router]);

  const isEditor = user?.role === "Editor";
  const userName = user?.name?.split(" ")[0] || "Admin";

  // ✅ Stats - Editor ke liye limited (sirf content-related)
  const adminStats = [
    { title: "Total Visitors", value: "12,345", icon: Eye, trend: "+12%", color: "blue" },
    { title: "Page Views", value: "45,678", icon: Eye, trend: "+8%", color: "green" },
    { title: "Admissions", value: "156", icon: CalendarCheck, trend: "+5%", color: "purple" },
    { title: "Results", value: "89", icon: Award, trend: "+3%", color: "orange" },
    { title: "News", value: "234", icon: Newspaper, trend: "+15%", color: "red" },
    { title: "Institutes", value: "45", icon: Building, trend: "+2%", color: "indigo" },
    { title: "Programs", value: "89", icon: BookOpen, trend: "+7%", color: "pink" },
    { title: "Cities", value: "23", icon: MapPin, trend: "+1%", color: "teal" },
  ];

  // ✅ Editor ke liye stats (sirf content stats)
  const editorStats = [
    { title: "Total Posts", value: "234", icon: FileText, trend: "+12%", color: "blue" },
    { title: "Published", value: "156", icon: Eye, trend: "+8%", color: "green" },
    { title: "Drafts", value: "45", icon: FileText, trend: "-3%", color: "orange" },
    { title: "Total Views", value: "45,678", icon: TrendingUp, trend: "+15%", color: "purple" },
  ];

  // ✅ Quick Actions - Editor ke liye
  const quickActions = [
    { title: "Create New Post", href: "/admin/post/create", icon: PlusCircle, color: "blue" },
    { title: "Upload Media", href: "/admin/media", icon: Image, color: "green" },
    { title: "Manage Categories", href: "/admin/categories", icon: FolderTree, color: "purple" },
    { title: "Manage Tags", href: "/admin/tags", icon: Tag, color: "orange" },
  ];

  const recentPosts = [
    { id: 1, title: "FAST University Admissions 2026 Open", status: "Published", date: "2 min ago" },
    { id: 2, title: "BISE Lahore Matric Result 2026 Announced", status: "Published", date: "1 hour ago" },
    { id: 3, title: "HEC Scholarship Deadline Extended", status: "Draft", date: "3 hours ago" },
    { id: 4, title: "NUST Entry Test Date Sheet Released", status: "Published", date: "5 hours ago" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Editor Dashboard
  if (isEditor) {
    return (
      <div>
        {/* Welcome Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome back, {userName}! 👋
          </h1>
          <p className="text-gray-500">
            Manage your content from here. You have Editor access.
          </p>
        </div>

        {/* Role Badge */}
        <div className="mb-6 inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
          Editor Access • Content Management Only
        </div>

        {/* Editor Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {editorStats.map((stat) => (
            <div key={stat.title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <ArrowUp size={12} /> {stat.trend}
                  </p>
                </div>
                <div className={`p-2 bg-${stat.color}-50 rounded-lg`}>
                  <stat.icon size={20} className={`text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions - Editor */}
        <div className="mb-6">
          <h2 className="font-semibold text-gray-800 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-md hover:border-blue-200 transition group"
              >
                <div className={`w-10 h-10 bg-${action.color}-50 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition`}>
                  <action.icon size={20} className={`text-${action.color}-600`} />
                </div>
                <p className="text-sm font-medium text-gray-700">{action.title}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Posts Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800">Recent Posts</h2>
            <Link href="/admin/post" className="text-sm text-blue-600 hover:underline">
              View All →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800">{post.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        post.status === "Published" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{post.date}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/post/${post.id}/edit`} className="text-sm text-blue-600 hover:underline">
                        Edit →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Editor Info Note */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-sm text-blue-700">
            💡 <span className="font-medium">Editor Access:</span> You can create, edit, and publish posts. 
            For user management and site settings, please contact your Administrator.
          </p>
        </div>
      </div>
    );
  }

  // Admin Dashboard (Original - Full Access)
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">Welcome back, {userName}! Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Live Visitors - Admin Only */}
      <div className="mb-6 bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp size={24} />
            <div>
              <p className="text-lg font-semibold">48 Active Visitors</p>
              <p className="text-sm text-green-100">Real-time visitors on your site</p>
            </div>
          </div>
          <Link href="/admin/analytics" className="px-3 py-1 bg-white/20 rounded-lg text-sm">
            View Details →
          </Link>
        </div>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {adminStats.map((stat) => (
          <div key={stat.title} className="bg-white rounded-lg shadow-sm border p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <ArrowUp size={12} /> {stat.trend}
                </p>
              </div>
              <div className={`p-2 bg-${stat.color}-50 rounded-lg`}>
                <stat.icon size={20} className={`text-${stat.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Recent Activity</h2>
        </div>
        <div className="divide-y">
          {recentPosts.map((activity) => (
            <div key={activity.id} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">{activity.title}</p>
                <p className="text-sm text-gray-500">{activity.date}</p>
              </div>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">{activity.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}