// app/admin/analytics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AnalyticsData {
  overview: {
    totalPageViews: number;
    uniqueVisitors: number;
    activeVisitors: number;
  };
  pageBreakdown: {
    pagePath: string;
    views: string | number;
    uniqueVisitors: string | number;
  }[];
  deviceBreakdown: Record<string, number>;
  countryBreakdown: Record<string, number>;
  cityBreakdown: Record<string, number>; // ✅ NEW
  recentViews: {
    id: number;
    pagePath: string;
    deviceType: string;
    country: string | null;
    city: string | null;
    viewedAt: string;
  }[];
  dailyStats: {
    date: string;
    pageViews: number;
    visitors: number;
    cityBreakdown?: Record<string, number>;
  }[];
}

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`/api/admin/analytics?period=${period}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [period]);

  // Chart data
  const pageViewsChart = {
    labels: data?.dailyStats.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
    }) || [],
    datasets: [
      {
        label: 'Page Views',
        data: data?.dailyStats.map(d => d.pageViews) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Visitors',
        data: data?.dailyStats.map(d => d.visitors) || [],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const deviceChart = {
    labels: data ? Object.keys(data.deviceBreakdown) : [],
    datasets: [
      {
        data: data ? Object.values(data.deviceBreakdown) : [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(139, 92, 246)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const countryChart = {
    labels: data ? Object.keys(data.countryBreakdown).slice(0, 5) : [],
    datasets: [
      {
        data: data ? Object.values(data.countryBreakdown).slice(0, 5) : [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
      },
    ],
  };

  // ✅ NEW - City Chart Data
  const cityChartData = {
    labels: data ? Object.keys(data.cityBreakdown).slice(0, 8) : [],
    datasets: [
      {
        label: 'Visitors',
        data: data ? Object.values(data.cityBreakdown).slice(0, 8) : [],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading analytics...</div>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number | string) => {
    return Number(num).toLocaleString();
  };

  const totalCities = data?.cityBreakdown ? Object.keys(data.cityBreakdown).length : 0;
  const topCity = data?.cityBreakdown 
    ? Object.entries(data.cityBreakdown).sort((a, b) => b[1] - a[1])[0] 
    : null;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time visitor analytics and page views
          </p>
        </div>
        
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
          
          <button
            onClick={fetchAnalytics}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats Cards - Added City Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-sm text-gray-500 mb-1">Active Visitors</div>
          <div className="text-3xl font-bold text-blue-600">
            {data?.overview.activeVisitors || 0}
          </div>
          <div className="text-xs text-gray-400 mt-1">Last 5 minutes</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-sm text-gray-500 mb-1">Page Views</div>
          <div className="text-3xl font-bold text-green-600">
            {formatNumber(data?.overview.totalPageViews || 0)}
          </div>
          <div className="text-xs text-gray-400 mt-1">Selected period</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-sm text-gray-500 mb-1">Unique Visitors</div>
          <div className="text-3xl font-bold text-purple-600">
            {formatNumber(data?.overview.uniqueVisitors || 0)}
          </div>
          <div className="text-xs text-gray-400 mt-1">Selected period</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-sm text-gray-500 mb-1">Pages/Visit</div>
          <div className="text-3xl font-bold text-orange-600">
            {data?.overview.uniqueVisitors 
              ? (data.overview.totalPageViews / data.overview.uniqueVisitors).toFixed(1) 
              : '0'}
          </div>
          <div className="text-xs text-gray-400 mt-1">Average</div>
        </div>

        {/* ✅ NEW - Cities Stat Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-sm text-gray-500 mb-1">Cities</div>
          <div className="text-3xl font-bold text-emerald-600">
            {totalCities}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {topCity ? `${topCity[0]}: ${topCity[1]}` : 'No data'}
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Page Views Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Daily Traffic</h2>
          <div className="h-80">
            <Line
              data={pageViewsChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Device Breakdown</h2>
          <div className="h-80 flex items-center justify-center">
            {Object.keys(data?.deviceBreakdown || {}).length > 0 ? (
              <Pie
                data={deviceChart}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                    },
                  },
                }}
              />
            ) : (
              <div className="text-gray-400">No data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 - Added City Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Pages Bar Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Top Pages</h2>
          <div className="h-80">
            <Bar
              data={{
                labels: data?.pageBreakdown.slice(0, 5).map(p => {
                  const path = p.pagePath;
                  return path.length > 20 ? path.substring(0, 20) + '...' : path;
                }) || [],
                datasets: [
                  {
                    label: 'Views',
                    data: data?.pageBreakdown.slice(0, 5).map(p => Number(p.views)) || [],
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
              }}
            />
          </div>
        </div>

        {/* ✅ NEW - City Breakdown Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>🏙️</span>
            <span>Top Cities in Pakistan</span>
          </h2>
          <div className="h-80">
            {Object.keys(data?.cityBreakdown || {}).length > 0 ? (
              <Bar
                data={cityChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: 'y' as const,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-4xl mb-2">🏙️</div>
                  <p>No city data available</p>
                  <p className="text-xs mt-2">Waiting for visitors from Pakistan</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 3 - Country and City Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Country Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Top Countries</h2>
          <div className="h-64">
            {Object.keys(data?.countryBreakdown || {}).length > 0 ? (
              <Pie
                data={countryChart}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                    },
                  },
                }}
              />
            ) : (
              <div className="text-gray-400">No country data available</div>
            )}
          </div>
        </div>

        {/* ✅ NEW - City Details List */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📍</span>
            <span>City-wise Visitors</span>
          </h2>
          
          {data?.cityBreakdown && Object.keys(data.cityBreakdown).length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {Object.entries(data.cityBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([city, count]) => {
                  const maxCount = Math.max(...Object.values(data.cityBreakdown));
                  const percentage = (count / maxCount) * 100;
                  
                  return (
                    <div 
                      key={city} 
                      className="flex items-center justify-between group hover:bg-gray-50 p-2 rounded-lg cursor-pointer"
                      onClick={() => setSelectedCity(city === selectedCity ? null : city)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📍</span>
                        <span className="font-medium">{city}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-600 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-16 text-right">
                          {count.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">🏙️</div>
              <p>No city data available yet</p>
              <p className="text-xs mt-2">Waiting for visitors from Pakistan</p>
            </div>
          )}
        </div>
      </div>

      {/* Selected City Details */}
      {selectedCity && data?.cityBreakdown && data.cityBreakdown[selectedCity] && (
        <div className="bg-green-50 rounded-lg border border-green-200 p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📍</span>
              <div>
                <h3 className="font-semibold text-green-800">{selectedCity}</h3>
                <p className="text-sm text-green-600">
                  Total Visitors: {data.cityBreakdown[selectedCity].toLocaleString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedCity(null)}
              className="text-green-600 hover:text-green-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Top Pages Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-6">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold">Top Pages</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Page Path
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unique Visitors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.pageBreakdown.map((page, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link 
                      href={page.pagePath}
                      target="_blank"
                      className="text-blue-600 hover:underline"
                    >
                      {page.pagePath}
                    </Link>
                  </td>
                  <td className="px-6 py-4 font-medium">{formatNumber(page.views)}</td>
                  <td className="px-6 py-4">{formatNumber(page.uniqueVisitors)}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {Math.round((Number(page.views) / Number(page.uniqueVisitors)) * 60)}s
                  </td>
                </tr>
              ))}
              
              {(!data?.pageBreakdown || data.pageBreakdown.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No page view data available for this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Visitors */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold">Recent Visitors</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Page
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  City
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.recentViews.map((view) => (
                <tr key={view.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link 
                      href={view.pagePath}
                      target="_blank"
                      className="text-blue-600 hover:underline"
                    >
                      {view.pagePath}
                    </Link>
                  </td>
                  <td className="px-6 py-4 capitalize">{view.deviceType}</td>
                  <td className="px-6 py-4">
                    {view.country || 'Unknown'}
                  </td>
                  <td className="px-6 py-4">
                    {view.city && view.city !== 'Unknown' ? view.city : '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(view.viewedAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
              
              {(!data?.recentViews || data.recentViews.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No recent visitors
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}