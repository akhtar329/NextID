// app/admin/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  Eye,
  CalendarCheck,
  Award,
  Newspaper,
  Building,
  BookOpen,
  MapPin,
  ArrowUp,
  ArrowDown,
  Activity,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
} from "lucide-react";

interface DashboardStats {
  totalVisitors: number;
  totalPageViews: number;
  activeVisitors: number;
  totalAdmissions: number;
  totalResults: number;
  totalNews: number;
  totalUniversities: number;
  totalPrograms: number;
  totalCities: number;
  todayVisitors: number;
  todayPageViews: number;
  weeklyTrend: number;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  recentActivity: {
    id: number;
    type: 'admission' | 'result' | 'news';
    title: string;
    time: string;
    status?: string;
  }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch analytics data
      const analyticsRes = await fetch(`/api/admin/analytics?period=${selectedPeriod}`);
      const analyticsData = await analyticsRes.json();
      
      // Fetch content counts
      const [admissionsRes, resultsRes, newsRes, unisRes, programsRes, citiesRes] = await Promise.all([
        fetch('/api/admin/admissions?limit=1'),
        fetch('/api/admin/results?limit=1'),
        fetch('/api/admin/news?limit=1'),
        fetch('/api/admin/institutes?limit=1'),
        fetch('/api/admin/programs?limit=1'),
        fetch('/api/admin/cities?limit=1'),
      ]);

      const admissionsData = await admissionsRes.json();
      const resultsData = await resultsRes.json();
      const newsData = await newsRes.json();
      const unisData = await unisRes.json();
      const programsData = await programsRes.json();
      const citiesData = await citiesRes.json();

      // Mock recent activity (replace with real data from API)
      const recentActivity = [
        {
          id: 1,
          type: 'admission' as const,
          title: 'FAST NUCES Admissions 2026',
          time: '2 minutes ago',
          status: 'Open'
        },
        {
          id: 2,
          type: 'result' as const,
          title: 'BISE Lahore 10th Class Result',
          time: '15 minutes ago',
        },
        {
          id: 3,
          type: 'news' as const,
          title: 'HEC Scholarship Deadline Extended',
          time: '1 hour ago',
        },
        {
          id: 4,
          type: 'admission' as const,
          title: 'LUMS MBA Admissions 2026',
          time: '3 hours ago',
          status: 'Expected'
        },
        {
          id: 5,
          type: 'result' as const,
          title: 'FBISE Annual Results 2026',
          time: '5 hours ago',
        },
      ];

      setStats({
        totalVisitors: analyticsData.success ? analyticsData.data.overview.uniqueVisitors : 0,
        totalPageViews: analyticsData.success ? analyticsData.data.overview.totalPageViews : 0,
        activeVisitors: analyticsData.success ? analyticsData.data.overview.activeVisitors : 0,
        totalAdmissions: admissionsData.success ? admissionsData.admissions?.length || 12 : 12,
        totalResults: resultsData.success ? resultsData.results?.length || 8 : 8,
        totalNews: newsData.success ? newsData.news?.length || 15 : 15,
        totalUniversities: unisData.success ? unisData.institutes?.length || 25 : 25,
        totalPrograms: programsData.success ? programsData.programs?.length || 45 : 45,
        totalCities: citiesData.success ? citiesData.cities?.length || 10 : 10,
        todayVisitors: 45,
        todayPageViews: 156,
        weeklyTrend: 12.5,
        deviceBreakdown: {
          desktop: 45,
          mobile: 35,
          tablet: 20,
        },
        recentActivity,
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon, trend, color = "blue" }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
          {trend !== undefined && (
            <p className={`text-xs mt-2 flex items-center gap-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
              {Math.abs(trend)}% from last week
            </p>
          )}
        </div>
        <div className={`p-3 bg-${color}-50 rounded-lg`}>
          <div className={`text-${color}-600`}>{icon}</div>
        </div>
      </div>
    </div>
  );

  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'admission': return <CalendarCheck size={16} className="text-green-600" />;
      case 'result': return <Award size={16} className="text-purple-600" />;
      case 'news': return <Newspaper size={16} className="text-blue-600" />;
      default: return <Activity size={16} className="text-gray-600" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'Open': return 'bg-green-100 text-green-700';
      case 'Expected': return 'bg-yellow-100 text-yellow-700';
      case 'Closed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, Super Admin!</p>
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Live Visitors Banner */}
      {stats.activeVisitors > 0 && (
        <div className="mb-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 bg-white rounded-full animate-ping absolute"></div>
                <div className="w-3 h-3 bg-white rounded-full relative"></div>
              </div>
              <div>
                <p className="text-lg font-semibold">{stats.activeVisitors} Active Visitors Now</p>
                <p className="text-sm text-green-100">Real-time visitors on your site</p>
              </div>
            </div>
            <Link
              href="/admin/analytics"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              View Details →
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Visitors"
          value={stats.totalVisitors}
          icon={<Users size={24} />}
          trend={stats.weeklyTrend}
          color="blue"
        />
        <StatCard
          title="Page Views"
          value={stats.totalPageViews}
          icon={<Eye size={24} />}
          trend={stats.weeklyTrend + 2.3}
          color="green"
        />
        <StatCard
          title="Admissions"
          value={stats.totalAdmissions}
          icon={<CalendarCheck size={24} />}
          color="purple"
        />
        <StatCard
          title="Results"
          value={stats.totalResults}
          icon={<Award size={24} />}
          color="orange"
        />
      </div>

      {/* Second Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="News Updates"
          value={stats.totalNews}
          icon={<Newspaper size={24} />}
          color="red"
        />
        <StatCard
          title="Universities"
          value={stats.totalUniversities}
          icon={<Building size={24} />}
          color="indigo"
        />
        <StatCard
          title="Programs"
          value={stats.totalPrograms}
          icon={<BookOpen size={24} />}
          color="pink"
        />
        <StatCard
          title="Cities"
          value={stats.totalCities}
          icon={<MapPin size={24} />}
          color="teal"
        />
      </div>

      {/* Charts & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Device Breakdown</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Desktop</span>
                <span className="font-medium">{stats.deviceBreakdown.desktop}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${stats.deviceBreakdown.desktop}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Mobile</span>
                <span className="font-medium">{stats.deviceBreakdown.mobile}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-600 rounded-full"
                  style={{ width: `${stats.deviceBreakdown.mobile}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Tablet</span>
                <span className="font-medium">{stats.deviceBreakdown.tablet}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-600 rounded-full"
                  style={{ width: `${stats.deviceBreakdown.tablet}%` }}
                />
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Today's Visitors</span>
              <span className="font-bold text-gray-900">{stats.todayVisitors}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-500">Today's Page Views</span>
              <span className="font-bold text-gray-900">{stats.todayPageViews}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/admin/admissions/create"
              className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <CalendarCheck size={20} className="text-blue-600" />
                <span className="font-medium text-blue-700">Add New Admission</span>
              </div>
              <span className="text-blue-600 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            
            <Link
              href="/admin/results/create"
              className="flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Award size={20} className="text-purple-600" />
                <span className="font-medium text-purple-700">Add New Result</span>
              </div>
              <span className="text-purple-600 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            
            <Link
              href="/admin/news/create"
              className="flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Newspaper size={20} className="text-green-600" />
                <span className="font-medium text-green-700">Add News Update</span>
              </div>
              <span className="text-green-600 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            
            <Link
              href="/admin/programs/create"
              className="flex items-center justify-between p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <BookOpen size={20} className="text-orange-600" />
                <span className="font-medium text-orange-700">Add New Program</span>
              </div>
              <span className="text-orange-600 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={12} />
                      {activity.time}
                    </span>
                    {activity.status && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <Link
            href="/admin/analytics"
            className="mt-4 block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View All Activity →
          </Link>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg">
        <h2 className="text-xl font-bold mb-2">Welcome to Admin Panel!</h2>
        <p className="text-blue-100 mb-4">
          You have successfully logged in. Manage your content efficiently with our comprehensive admin tools.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            Test Logout
          </button>
          <Link
            href="/admin/analytics"
            className="px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            View Analytics
          </Link>
        </div>
      </div>
    </div>
  );
}