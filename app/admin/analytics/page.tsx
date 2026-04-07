// app/admin/analytics/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Filler,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
);

// ✅ Simple array - no type annotation needed
const GOOGLE_MAPS_LIBRARIES = ['visualization'];

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
  cityBreakdown: Record<string, number>;
  recentViews: {
    id: number;
    pagePath: string;
    deviceType: string;
    country: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
    viewedAt: string;
  }[];
  dailyStats: {
    date: string;
    pageViews: number;
    visitors: number;
  }[];
  visitorLocations: {
    lat: number;
    lng: number;
    weight: number;
    city: string;
    country: string;
    lastVisit: string;
    visitors: {
      time: string;
      page: string;
    }[];
  }[];
}

const mapContainerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '0.75rem',
};

const defaultCenter = {
  lat: 30.3753,
  lng: 69.3451,
};

const mapOptions = {
  mapTypeControl: true,
  streetViewControl: true,
  fullscreenControl: true,
  zoomControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(5);
  const [selectedLocation, setSelectedLocation] = useState<{
    position: { lat: number; lng: number };
    city: string;
    country: string;
    visitors: number;
    lastVisit: string;
    recentVisitors: any[];
  } | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',

    version: 'weekly',
  });

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
    const interval = setInterval(fetchAnalytics, 60000);
    return () => clearInterval(interval);
  }, [period]);

  // ✅ Validate and filter markers data
  const markersData = useMemo(() => {
    if (!data?.visitorLocations) return [];
    return data.visitorLocations.filter(loc => {
      const lat = typeof loc.lat === 'number' ? loc.lat : parseFloat(String(loc.lat));
      const lng = typeof loc.lng === 'number' ? loc.lng : parseFloat(String(loc.lng));
      return !isNaN(lat) && !isNaN(lng);
    });
  }, [data?.visitorLocations]);

  const pageViewsChart = {
    labels: data?.dailyStats?.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-PK', { day: '2-digit', month: 'short' });
    }) || [],
    datasets: [
      {
        label: 'Page Views',
        data: data?.dailyStats?.map(d => d.pageViews) || [],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Visitors',
        data: data?.dailyStats?.map(d => d.visitors) || [],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const deviceChart = {
    labels: data?.deviceBreakdown ? Object.keys(data.deviceBreakdown) : [],
    datasets: [
      {
        data: data?.deviceBreakdown ? Object.values(data.deviceBreakdown) : [],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'],
      },
    ],
  };

  const countryChart = {
    labels: data?.countryBreakdown ? Object.keys(data.countryBreakdown).slice(0, 5) : [],
    datasets: [
      {
        data: data?.countryBreakdown ? Object.values(data.countryBreakdown).slice(0, 5) : [],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'],
      },
    ],
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number | string) => Number(num).toLocaleString();

  // Sort locations by weight for top cities list
  const sortedLocations = data?.visitorLocations ? [...data.visitorLocations].sort((a, b) => b.weight - a.weight) : [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              Real-time visitor insights and geographic distribution
            </p>
          </div>
          
          <div className="flex gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
            
            <button
              onClick={fetchAnalytics}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active Visitors</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{data?.overview?.activeVisitors || 0}</p>
            <p className="text-xs text-gray-400 mt-1">Last 5 minutes</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Page Views</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{formatNumber(data?.overview?.totalPageViews || 0)}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Unique Visitors</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{formatNumber(data?.overview?.uniqueVisitors || 0)}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pages/Visit</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {data?.overview?.uniqueVisitors && data?.overview?.totalPageViews
                ? (data.overview.totalPageViews / data.overview.uniqueVisitors).toFixed(2) 
                : '0'}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="space-y-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Traffic Overview</h2>
          <div className="h-80">
            <Line 
              data={pageViewsChart} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' as const } },
              }} 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Devices</h2>
            <div className="h-64">
              {data?.deviceBreakdown && Object.keys(data.deviceBreakdown).length > 0 ? (
                <Pie data={deviceChart} options={{ responsive: true, maintainAspectRatio: false }} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">No data</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Countries</h2>
            <div className="h-64">
              {data?.countryBreakdown && Object.keys(data.countryBreakdown).length > 0 ? (
                <Pie data={countryChart} options={{ responsive: true, maintainAspectRatio: false }} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">No data</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Pages</h2>
            <div className="space-y-3">
              {data?.pageBreakdown?.slice(0, 5).map((page, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <Link href={page.pagePath} target="_blank" className="text-sm text-blue-600 hover:underline truncate max-w-[150px]">
                    {page.pagePath}
                  </Link>
                  <span className="text-sm font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded">
                    {formatNumber(page.views)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Visitors Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Recent Visitors</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Page</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.recentViews?.map((view) => (
                <tr key={view.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{formatDate(view.viewedAt)}</td>
                  <td className="px-6 py-4">
                    <Link href={view.pagePath} target="_blank" className="text-sm text-blue-600 hover:underline">
                      {view.pagePath}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 capitalize">{view.deviceType}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{view.country || 'Unknown'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{view.city && view.city !== 'Unknown' ? view.city : '-'}</td>
                </tr>
              ))}
              {(!data?.recentViews || data.recentViews.length === 0) && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No visitor data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Google Maps Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">🌍</span>
            Visitor Geographic Distribution
          </h2>
        </div>

        <div className="p-6">
          {isLoaded ? (
            <div className="relative">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={mapZoom}
                options={mapOptions}
                onClick={() => setSelectedLocation(null)}
              >
                {markersData.map((loc, index) => {
                  // ✅ Safely convert coordinates to numbers
                  const lat = typeof loc.lat === 'number' ? loc.lat : parseFloat(String(loc.lat));
                  const lng = typeof loc.lng === 'number' ? loc.lng : parseFloat(String(loc.lng));
                  
                  // ✅ Skip if invalid coordinates
                  if (isNaN(lat) || isNaN(lng)) return null;
                  
                  return (
                    <Marker
                      key={index}
                      position={{ lat, lng }}
                      onClick={() => {
                        setSelectedLocation({
                          position: { lat, lng },
                          city: loc.city,
                          country: loc.country,
                          visitors: loc.weight,
                          lastVisit: loc.lastVisit,
                          recentVisitors: loc.visitors || [],
                        });
                        setMapCenter({ lat, lng });
                        setMapZoom(12);
                      }}
                      title={loc.city}
                      icon={{
                        url: `https://maps.google.com/mapfiles/ms/icons/${loc.weight > 20 ? 'red' : loc.weight > 10 ? 'orange' : 'green'}-dot.png`,
                      }}
                    />
                  );
                })}
                
                {selectedLocation && (
                  <InfoWindow
                    position={selectedLocation.position}
                    onCloseClick={() => setSelectedLocation(null)}
                  >
                    <div className="p-4 max-w-xs">
                      <h3 className="font-bold text-gray-900 text-xl">{selectedLocation.city}</h3>
                      <p className="text-sm text-gray-600 mb-3">{selectedLocation.country}</p>
                      <div className="bg-blue-50 rounded-lg p-3 mb-3">
                        <p className="text-xs text-gray-500">Total Visitors</p>
                        <p className="text-2xl font-bold text-blue-600">{selectedLocation.visitors}</p>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">Last Visit</p>
                      <p className="text-sm text-gray-700 mb-3">{formatDate(selectedLocation.lastVisit)}</p>
                      {selectedLocation.recentVisitors.length > 0 && (
                        <>
                          <p className="text-xs text-gray-500 mb-1">Recent Activity</p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {selectedLocation.recentVisitors.slice(0, 3).map((v, i) => (
                              <div key={i} className="text-xs border-b pb-1">
                                <p className="text-gray-800 truncate">{v.page}</p>
                                <p className="text-gray-500">{formatShortDate(v.time)}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>

              {/* Stats Overlay with City List */}
              {markersData.length > 0 && (
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-xs font-medium text-gray-500">LIVE LOCATIONS</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{markersData.length}</p>
                  <p className="text-xs text-gray-400 mb-3">active cities worldwide</p>
                  <div className="border-t border-gray-100 pt-2">
                    <p className="text-xs font-semibold text-gray-600 mb-2">📍 Top Cities</p>
                    <div className="space-y-1.5">
                      {sortedLocations.slice(0, 5).map((loc, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-gray-700 truncate max-w-[100px]">{loc.city || 'Unknown'}</span>
                          <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{loc.weight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-600">Loading Google Maps...</p>
                {loadError && (
                  <p className="text-red-500 text-sm mt-2">Failed to load Google Maps. Please check API key.</p>
                )}
              </div>
            </div>
          )}

          {markersData.length > 0 && (
            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span><span className="text-gray-600">&lt; 10 visits</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500"></span><span className="text-gray-600">10-20 visits</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span><span className="text-gray-600">&gt; 20 visits</span></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}