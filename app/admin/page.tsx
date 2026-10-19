"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText, CheckCircle, Clock, Users, TrendingUp,
  ArrowUpRight, ArrowDownRight, Activity, Eye, Edit,
  Plus, RefreshCw, AlertCircle, Sparkles, Zap,
  BarChart3, Target, Calendar, ChevronRight, Layers,
  Settings, Bell, UserCheck
} from "lucide-react";

// ==================== TYPES ====================
interface User {
  name: string;
  role: "Admin" | "Editor";
}

interface DashboardData {
  totalPosts: number;
  published: number;
  drafts: number;
  editors: number;
  weeklyGrowth: number;
}

interface RecentPost {
  id: number;
  title: string;
  type: string;
  status: string;
  createdAt: string;
}

// ==================== SKELETON ====================
const DashboardSkeleton = () => (
  <div className="p-4 sm:p-8 space-y-6 animate-pulse">
    <div className="h-20 bg-gray-200 rounded-2xl" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl" />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 h-96 bg-gray-200 rounded-2xl" />
      <div className="h-96 bg-gray-200 rounded-2xl" />
    </div>
  </div>
);

// ==================== STAT CARD ====================
const StatCard = ({
  title, value, icon: Icon, gradient, iconBg, trend, trendValue, link
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
  trend?: "up" | "down";
  trendValue?: string;
  link?: string;
}) => {
  const content = (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:border-gray-200 transition-all duration-300 group cursor-pointer">
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 -mr-10 -mt-10 ${gradient}`} />
      <div className="relative flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && trendValue && (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${trend === "up" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trendValue}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
      </div>
    </div>
  );

  if (link) return <Link href={link}>{content}</Link>;
  return content;
};

// ==================== MAIN COMPONENT ====================
export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) { router.push("/login"); return; }
      const json = await res.json();
      setUser(json.user);
      setData(json.data);
      if (json.recentPosts) setRecentPosts(json.recentPosts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <DashboardSkeleton />;
  if (!user || !data) return null;

  const publishRate = data.totalPosts > 0 ? Math.round((data.published / data.totalPosts) * 100) : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      admission: "bg-blue-100 text-blue-700",
      result: "bg-emerald-100 text-emerald-700",
      news: "bg-red-100 text-red-700",
      date_sheet: "bg-orange-100 text-orange-700",
      scholarship: "bg-amber-100 text-amber-700",
      job: "bg-indigo-100 text-indigo-700",
      blog: "bg-purple-100 text-purple-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const diff = Date.now() - d.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* ===== WELCOME BANNER ===== */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-500/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20" />
          <div className="absolute bottom-0 right-20 w-40 h-40 bg-white/10 rounded-full -mb-20" />
          <div className="relative flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <span className="text-xs font-bold text-white/80 uppercase tracking-widest">Dashboard</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                {getGreeting()}, {user.name.split(" ")[0]}! 👋
              </h1>
              <p className="text-blue-100 text-sm">
                You're logged in as <span className="font-bold text-white">{user.role}</span> • Here's what's happening today
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => load(true)}
                disabled={refreshing}
                className="px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition text-sm font-semibold flex items-center gap-2 disabled:opacity-50 border border-white/30"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <Link
                href="/admin/post/create"
                className="px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl transition text-sm font-bold flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                New Post
              </Link>
            </div>
          </div>
        </div>

        {/* ===== STATS GRID ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Posts"
            value={data.totalPosts}
            icon={FileText}
            gradient="bg-blue-500"
            iconBg="bg-blue-100 text-blue-600"
            link="/admin/post"
          />
          <StatCard
            title="Published"
            value={data.published}
            icon={CheckCircle}
            gradient="bg-emerald-500"
            iconBg="bg-emerald-100 text-emerald-600"
            trend="up"
            trendValue={`${publishRate}%`}
            link="/admin/post?status=published"
          />
          <StatCard
            title="Drafts"
            value={data.drafts}
            icon={Clock}
            gradient="bg-amber-500"
            iconBg="bg-amber-100 text-amber-600"
            link="/admin/post?status=draft"
          />
          <StatCard
            title="Editors"
            value={data.editors}
            icon={Users}
            gradient="bg-purple-500"
            iconBg="bg-purple-100 text-purple-600"
            link="/admin/users"
          />
        </div>

        {/* ===== MAIN CONTENT GRID ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: Performance + Quick Actions */}
          <div className="lg:col-span-2 space-y-6">

            {/* PERFORMANCE CARD */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Performance Overview
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Your content metrics at a glance</p>
                </div>
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {data.weeklyGrowth}% growth
                </span>
              </div>

              {/* Progress Bars */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Published Posts</span>
                    <span className="text-sm font-bold text-gray-900">{data.published} / {data.totalPosts}</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-1000"
                      style={{ width: `${publishRate}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Drafts</span>
                    <span className="text-sm font-bold text-gray-900">{data.drafts} / {data.totalPosts}</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-1000"
                      style={{ width: `${data.totalPosts > 0 ? Math.round((data.drafts / data.totalPosts) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{data.totalPosts}</p>
                  <p className="text-xs text-gray-500 font-medium mt-1">Total</p>
                </div>
                <div className="text-center border-x border-gray-100">
                  <p className="text-2xl font-bold text-emerald-600">{data.published}</p>
                  <p className="text-xs text-gray-500 font-medium mt-1">Live</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">{data.drafts}</p>
                  <p className="text-xs text-gray-500 font-medium mt-1">Draft</p>
                </div>
              </div>
            </div>

            {/* RECENT POSTS */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  Recent Posts
                </h2>
                <Link href="/admin/post" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  View all <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {recentPosts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">No posts yet</p>
                  <Link href="/admin/post/create" className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-blue-600 hover:text-blue-700">
                    Create your first post <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentPosts.slice(0, 5).map((post) => (
                    <Link
                      key={post.id}
                      href={`/admin/post/${post.id}/edit`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition group"
                    >
                      <div className={`w-10 h-10 rounded-lg ${getTypeColor(post.type)} flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                        {post.title.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition">
                          {post.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${getTypeColor(post.type)}`}>
                            {post.type}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{formatDate(post.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <Eye className="w-4 h-4 text-gray-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Quick Actions + System Status */}
          <div className="space-y-6">

            {/* QUICK ACTIONS */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Quick Actions
              </h2>
              <div className="space-y-2">
                {[
                  { href: "/admin/post/create", icon: Plus, label: "Create New Post", color: "blue" },
                  { href: "/admin/users", icon: UserCheck, label: "Manage Users", color: "purple" },
                  { href: "/admin/notifications", icon: Bell, label: "Notifications", color: "orange" },
                  { href: "/admin/settings", icon: Settings, label: "Settings", color: "gray" },
                ].map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition group border border-transparent hover:border-gray-200"
                  >
                    <div className={`w-9 h-9 rounded-lg bg-${action.color}-100 text-${action.color}-600 flex items-center justify-center group-hover:scale-110 transition`}>
                      <action.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 flex-1">{action.label}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition" />
                  </Link>
                ))}
              </div>
            </div>

            {/* SYSTEM STATUS */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
              <div className="relative">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-400" />
                  System Status
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Status</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      Operational
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Role</span>
                    <span className="text-sm font-semibold text-white">{user.role}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Growth</span>
                    <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{data.weeklyGrowth}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* HELP CARD */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-blue-900 mb-1">Need Help?</h3>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Check documentation or contact support for assistance.
                  </p>
                  <Link href="/admin/settings" className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-blue-600 hover:text-blue-700">
                    Go to Settings <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} NextID • Admin Dashboard • Last updated {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}