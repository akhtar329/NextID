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
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { GoogleMap, HeatmapLayer, Marker, useJsApiLoader } from '@react-google-maps/api';

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
  }[];
}

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem',
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
};

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(5);
  const [mapType, setMapType] = useState<'markers' | 'heatmap'>('heatmap');

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`/api/admin/analytics?period=${period}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
        
        if (result.data.visitorLocations && result.data.visitorLocations.length > 0) {
          setMapCenter({
            lat: result.data.visitorLocations[0].lat,
            lng: result.data.visitorLocations[0].lng,
          });
          setMapZoom(4);
        }
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
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [period]);

  // 👇 FIXED: Safe heatmap data creation with null checks
  const heatmapData = useMemo(() => {
    if (!isLoaded || !data?.visitorLocations || data.visitorLocations.length === 0) {
      return [];
    }
    
    try {
      return data.visitorLocations.map(loc => ({
        location: new google.maps.LatLng(loc.lat, loc.lng),
        weight: loc.weight,
      }));
    } catch (error) {
      console.error('Error creating heatmap data:', error);
      return [];
    }
  }, [isLoaded, data?.visitorLocations]);

  // Chart data with null checks
  const pageViewsChart = {
    labels: data?.dailyStats?.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
    }) || [],
    datasets: [
      {
        label: 'Page Views',
        data: data?.dailyStats?.map(d => d.pageViews) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Visitors',
        data: data?.dailyStats?.map(d => d.visitors) || [],
        borderColor: 'rgb(16, 185, 129)',
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
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
      },
    ],
  };

  const countryChart = {
    labels: data?.countryBreakdown ? Object.keys(data.countryBreakdown).slice(0, 5) : [],
    datasets: [
      {
        data: data?.countryBreakdown ? Object.values(data.countryBreakdown).slice(0, 5) : [],
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

  const cityChartData = {
    labels: data?.cityBreakdown ? Object.keys(data.cityBreakdown).slice(0, 8) : [],
    datasets: [
      {
        label: 'Visitors',
        data: data?.cityBreakdown ? Object.values(data.cityBreakdown).slice(0, 8) : [],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
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

  const formatNumber = (num: number | string) => Number(num).toLocaleString();
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
            Real-time visitor analytics with location tracking
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-sm text-gray-500 mb-1">Active Visitors</div>
          <div className="text-3xl font-bold text-blue-600">
            {data?.overview?.activeVisitors || 0}
          </div>
          <div className="text-xs text-gray-400 mt-1">Last 5 minutes</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-sm text-gray-500 mb-1">Page Views</div>
          <div className="text-3xl font-bold text-green-600">
            {formatNumber(data?.overview?.totalPageViews || 0)}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-sm text-gray-500 mb-1">Unique Visitors</div>
          <div className="text-3xl font-bold text-purple-600">
            {formatNumber(data?.overview?.uniqueVisitors || 0)}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-sm text-gray-500 mb-1">Pages/Visit</div>
          <div className="text-3xl font-bold text-orange-600">
            {data?.overview?.uniqueVisitors && data?.overview?.totalPageViews
              ? (data.overview.totalPageViews / data.overview.uniqueVisitors).toFixed(1) 
              : '0'}
          </div>
        </div>

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

      {/* 🌍 GOOGLE MAPS SECTION - FIXED */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-2xl">🌍</span>
            Visitor Locations Map
          </h2>
          
          <div className="flex gap-2">
            <button
              onClick={() => setMapType('heatmap')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                mapType === 'heatmap' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🔥 Heatmap
            </button>
            <button
              onClick={() => setMapType('markers')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                mapType === 'markers' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📍 Markers
            </button>
          </div>
        </div>

        {isLoaded ? (
          <div className="relative">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={mapZoom}
              options={mapOptions}
            >
              {/* Heatmap Layer - Only render when data exists */}
              {mapType === 'heatmap' && heatmapData.length > 0 && (
                <HeatmapLayer
                  data={heatmapData}
                  options={{
                    radius: 20,
                    opacity: 0.6,
                    dissipating: true,
                  }}
                />
              )}

              {/* Markers */}
              {mapType === 'markers' && data?.visitorLocations?.map((loc, index) => (
                <Marker
                  key={index}
                  position={{ lat: loc.lat, lng: loc.lng }}
                  title={`${loc.city}, ${loc.country} (${loc.weight} visits)`}
                  icon={{
                    url: `https://maps.google.com/mapfiles/ms/icons/${
                      loc.weight > 10 ? 'red' : loc.weight > 5 ? 'yellow' : 'green'
                    }-dot.png`,
                  }}
                />
              ))}
            </GoogleMap>

            {/* Stats overlay */}
            {data?.visitorLocations && data.visitorLocations.length > 0 && (
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                <div className="text-sm">
                  <div className="font-medium mb-1">📍 Active Locations</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {data.visitorLocations.length}
                  </div>
                  <div className="text-xs text-gray-500">Cities worldwide</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="text-gray-500">Loading Google Maps...</p>
            </div>
          </div>
        )}

        {/* Legend */}
        {data?.visitorLocations && data.visitorLocations.length > 0 && (
          <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span>&lt; 5 visits</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span>5-10 visits</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span>&gt; 10 visits</span>
            </div>
          </div>
        )}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Daily Traffic</h2>
          <div className="h-80">
            <Line data={pageViewsChart} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Device Breakdown</h2>
          <div className="h-80 flex items-center justify-center">
            {data?.deviceBreakdown && Object.keys(data.deviceBreakdown).length > 0 ? (
              <Pie data={deviceChart} options={{ responsive: true, maintainAspectRatio: false }} />
            ) : (
              <div className="text-gray-400">No data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Top Pages</h2>
          <div className="h-80">
            <Bar
              data={{
                labels: data?.pageBreakdown?.slice(0, 5).map(p => 
                  p.pagePath.length > 20 ? p.pagePath.substring(0, 20) + '...' : p.pagePath
                ) || [],
                datasets: [{
                  label: 'Views',
                  data: data?.pageBreakdown?.slice(0, 5).map(p => Number(p.views)) || [],
                  backgroundColor: 'rgba(59, 130, 246, 0.8)',
                }],
              }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>🏙️</span> Top Cities
          </h2>
          <div className="h-80">
            {data?.cityBreakdown && Object.keys(data.cityBreakdown).length > 0 ? (
              <Bar
                data={cityChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: 'y' as const,
                  plugins: { legend: { display: false } },
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-4xl mb-2">🏙️</div>
                  <p>No city data available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Visitors Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold">Recent Visitors</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Page</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Map</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.recentViews?.map((view) => (
                <tr key={view.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link href={view.pagePath} target="_blank" className="text-blue-600 hover:underline">
                      {view.pagePath}
                    </Link>
                  </td>
                  <td className="px-6 py-4 capitalize">{view.deviceType}</td>
                  <td className="px-6 py-4">{view.country || 'Unknown'}</td>
                  <td className="px-6 py-4">{view.city && view.city !== 'Unknown' ? view.city : '-'}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(view.viewedAt).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4">
                    {view.latitude && view.longitude && (
                      <button
                        onClick={() => {
                          setMapCenter({ lat: view.latitude!, lng: view.longitude! });
                          setMapZoom(10);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="View on map"
                      >
                        📍
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              
              {(!data?.recentViews || data.recentViews.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
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