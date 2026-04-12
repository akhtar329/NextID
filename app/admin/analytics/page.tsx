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
import { Moon, Sun, X } from 'lucide-react';

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
  filters?: {
    period: string;
    country: string | null;
    city: string | null;
  };
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

const getMapOptions = (isDarkMode: boolean) => ({
  mapTypeControl: true,
  streetViewControl: true,
  fullscreenControl: true,
  zoomControl: true,
  styles: isDarkMode ? [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'all',
      elementType: 'geometry',
      stylers: [{ color: '#242f3e' }],
    },
    {
      featureType: 'all',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#746855' }],
    },
    {
      featureType: 'all',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#242f3e' }],
    },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#17263c' }],
    },
  ] : [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
});

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState<'24h' | 'week' | 'month'>('week');
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(5);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    position: { lat: number; lng: number };
    city: string;
    country: string;
    visitors: number;
    lastVisit: string;
    recentVisitors: any[];
  } | null>(null);
  const [cityDetailsModal, setCityDetailsModal] = useState<{
    open: boolean;
    city: string;
    country: string;
    visitors: any[];
  } | null>(null);

  // Load theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark';
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    version: 'weekly',
  });

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      let url = `/api/admin/analytics?period=${period}`;
      if (countryFilter) {
        url += `&country=${encodeURIComponent(countryFilter)}`;
      }
      if (cityFilter) {
        url += `&city=${encodeURIComponent(cityFilter)}`;
      }
      const res = await fetch(url);
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
  }, [period, countryFilter, cityFilter]);

  const clearFilters = () => {
    setCountryFilter(null);
    setCityFilter(null);
    setPeriod('week');
  };

  const handleCountryClick = (country: string) => {
    setCountryFilter(country);
    setCityFilter(null);
  };

  const handleCityClickForDetails = async (city: string, country: string) => {
    try {
      const res = await fetch(`/api/admin/analytics/city?city=${encodeURIComponent(city)}&period=${period}`);
      const result = await res.json();
      if (result.success) {
        setCityDetailsModal({
          open: true,
          city: city,
          country: country,
          visitors: result.data,
        });
      }
    } catch (error) {
      console.error('Error fetching city details:', error);
    }
  };

  const markersData = useMemo(() => {
    if (!data?.visitorLocations) return [];
    return data.visitorLocations.filter(loc => {
      const lat = typeof loc.lat === 'number' ? loc.lat : parseFloat(String(loc.lat));
      const lng = typeof loc.lng === 'number' ? loc.lng : parseFloat(String(loc.lng));
      return !isNaN(lat) && !isNaN(lng);
    });
  }, [data?.visitorLocations]);

  const handleCityClick = (city: string) => {
    const cityData = data?.visitorLocations.find(loc => loc.city === city);
    if (cityData) {
      const lat = typeof cityData.lat === 'number' ? cityData.lat : parseFloat(String(cityData.lat));
      const lng = typeof cityData.lng === 'number' ? cityData.lng : parseFloat(String(cityData.lng));
      
      if (!isNaN(lat) && !isNaN(lng)) {
        setSelectedLocation({
          position: { lat, lng },
          city: cityData.city,
          country: cityData.country,
          visitors: cityData.weight,
          lastVisit: cityData.lastVisit,
          recentVisitors: cityData.visitors || [],
        });
        setMapCenter({ lat, lng });
        setMapZoom(12);
      }
    }
  };

  const chartTextColor = isDarkMode ? '#e5e7eb' : '#374151';
  
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

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number | string) => Number(num).toLocaleString();
  const sortedLocations = data?.visitorLocations ? [...data.visitorLocations].sort((a, b) => b.weight - a.weight) : [];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} p-8 transition-colors duration-300`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Analytics Dashboard
            </h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
              Real-time visitor insights and geographic distribution
            </p>
            {(countryFilter || cityFilter) && (
              <div className="flex gap-2 mt-2">
                {countryFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs">
                    Country: {countryFilter}
                    <button onClick={() => setCountryFilter(null)} className="hover:text-blue-600">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {cityFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs">
                    City: {cityFilter}
                    <button onClick={() => setCityFilter(null)} className="hover:text-green-600">
                      <X size={12} />
                    </button>
                  </span>
                )}
                <button
                  onClick={clearFilters}
                  className="px-2 py-1 bg-gray-500 text-white rounded-md text-xs hover:bg-gray-600"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg border transition-colors ${
                isDarkMode 
                  ? 'border-gray-600 text-yellow-500 hover:bg-gray-800' 
                  : 'border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value as any);
                setCountryFilter(null);
                setCityFilter(null);
              }}
              className={`px-4 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="24h">Last 24 Hours</option>
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
          <div className={`rounded-xl shadow-sm border p-6 transition-colors ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <p className={`text-sm font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Active Visitors
            </p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{data?.overview?.activeVisitors || 0}</p>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Last 5 minutes</p>
          </div>
          
          <div className={`rounded-xl shadow-sm border p-6 transition-colors ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <p className={`text-sm font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Page Views
            </p>
            <p className="text-3xl font-bold text-green-600 mt-2">{formatNumber(data?.overview?.totalPageViews || 0)}</p>
          </div>
          
          <div className={`rounded-xl shadow-sm border p-6 transition-colors ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <p className={`text-sm font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Unique Visitors
            </p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{formatNumber(data?.overview?.uniqueVisitors || 0)}</p>
          </div>
          
          <div className={`rounded-xl shadow-sm border p-6 transition-colors ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <p className={`text-sm font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Pages/Visit
            </p>
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
        <div className={`rounded-xl shadow-sm border p-6 transition-colors ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Daily Traffic Overview
          </h2>
          <div className="h-80">
            <Line 
              data={pageViewsChart} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { 
                  legend: { 
                    position: 'top' as const,
                    labels: { color: chartTextColor }
                  },
                },
                scales: {
                  x: { ticks: { color: chartTextColor } },
                  y: { ticks: { color: chartTextColor } }
                }
              }} 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`rounded-xl shadow-sm border p-6 transition-colors ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Devices
            </h2>
            <div className="h-64">
              {data?.deviceBreakdown && Object.keys(data.deviceBreakdown).length > 0 ? (
                <Pie data={deviceChart} options={{ responsive: true, maintainAspectRatio: false }} />
              ) : (
                <div className={`h-full flex items-center justify-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  No data
                </div>
              )}
            </div>
          </div>

          <div className={`rounded-xl shadow-sm border p-6 transition-colors ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Top Countries
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data?.countryBreakdown && Object.entries(data.countryBreakdown).slice(0, 5).map(([country, count]) => (
                <div 
                  key={country}
                  onClick={() => handleCountryClick(country)}
                  className={`flex items-center justify-between cursor-pointer p-2 rounded transition-colors ${
                    countryFilter === country
                      ? 'bg-blue-100 dark:bg-blue-900/50'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-sm font-medium">{country}</span>
                  <span className="text-sm text-gray-500">{formatNumber(count)}</span>
                </div>
              ))}
              {(!data?.countryBreakdown || Object.keys(data.countryBreakdown).length === 0) && (
                <div className="text-center py-8 text-gray-400">No data</div>
              )}
            </div>
          </div>

          <div className={`rounded-xl shadow-sm border p-6 transition-colors ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Top Pages
            </h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {data?.pageBreakdown?.slice(0, 10).map((page, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <Link href={page.pagePath} target="_blank" className={`text-sm hover:underline truncate max-w-[180px] ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    {page.pagePath}
                  </Link>
                  <span className={`text-sm font-medium px-2 py-1 rounded ${
                    isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {formatNumber(page.views)}
                  </span>
                </div>
              ))}
              {(!data?.pageBreakdown || data.pageBreakdown.length === 0) && (
                <div className={`text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  No page data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Visitors Table */}
      <div className={`rounded-xl shadow-sm border overflow-hidden mb-8 transition-colors ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Recent Visitors
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Date & Time
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Page
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Device
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Location
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  City
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {data?.recentViews?.map((view) => (
                <tr key={view.id} className={`transition-colors ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                  <td className={`px-6 py-4 text-sm whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {formatDate(view.viewedAt)}
                  </td>
                  <td className="px-6 py-4">
                    <Link href={view.pagePath} target="_blank" className={`text-sm hover:underline ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      {view.pagePath}
                    </Link>
                  </td>
                  <td className={`px-6 py-4 text-sm capitalize ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {view.deviceType || 'Unknown'}
                  </td>
                  <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {view.country || 'Unknown'}
                  </td>
                  <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {view.city && view.city !== 'Unknown' ? view.city : '-'}
                  </td>
                </tr>
              ))}
              {(!data?.recentViews || data.recentViews.length === 0) && (
                <tr>
                  <td colSpan={5} className={`px-6 py-12 text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    No visitor data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Google Maps Section */}
      <div className={`rounded-xl shadow-sm border overflow-hidden transition-colors ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <span className="text-2xl">🌍</span>
            Visitor Geographic Distribution
          </h2>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Click on any city in the list to zoom to its location
          </p>
        </div>

        <div className="p-6">
          {isLoaded ? (
            <div className="relative">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={mapZoom}
                options={getMapOptions(isDarkMode)}
                onClick={() => setSelectedLocation(null)}
              >
                {markersData.map((loc, index) => {
                  const lat = typeof loc.lat === 'number' ? loc.lat : parseFloat(String(loc.lat));
                  const lng = typeof loc.lng === 'number' ? loc.lng : parseFloat(String(loc.lng));
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
                      <button
                        onClick={() => handleCityClickForDetails(selectedLocation.city, selectedLocation.country)}
                        className="w-full px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                      >
                        View All Visitors from {selectedLocation.city}
                      </button>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>

              {/* Stats Overlay */}
              {markersData.length > 0 && (
                <div className={`absolute bottom-4 left-4 backdrop-blur-sm rounded-xl p-4 shadow-lg border min-w-[220px] max-h-[400px] overflow-y-auto ${
                  isDarkMode 
                    ? 'bg-gray-900/95 border-gray-700' 
                    : 'bg-white/95 border-gray-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      LIVE LOCATIONS
                    </p>
                  </div>
                  <p className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {markersData.length}
                  </p>
                  <p className={`text-xs mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    active cities worldwide
                  </p>
                  <div className={`border-t pt-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    <p className={`text-xs font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      📍 Top Cities (Click to view)
                    </p>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {sortedLocations.slice(0, 15).map((loc, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => handleCityClick(loc.city)}
                          className={`flex justify-between items-center text-xs cursor-pointer p-1.5 rounded transition-colors group ${
                            isDarkMode 
                              ? 'hover:bg-gray-800' 
                              : 'hover:bg-blue-50'
                          }`}
                        >
                          <span className={`truncate max-w-[130px] font-medium ${
                            isDarkMode 
                              ? 'text-gray-300 group-hover:text-blue-400' 
                              : 'text-gray-700 group-hover:text-blue-600'
                          }`}>
                            {loc.city || 'Unknown'}
                          </span>
                          <span className={`font-semibold px-2 py-0.5 rounded-full ${
                            isDarkMode 
                              ? 'text-blue-400 bg-blue-900/50 group-hover:bg-blue-800/50' 
                              : 'text-blue-600 bg-blue-50 group-hover:bg-blue-100'
                          }`}>
                            {loc.weight}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={`h-96 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading Google Maps...</p>
                {loadError && (
                  <p className="text-red-500 text-sm mt-2">Failed to load Google Maps. Please check API key.</p>
                )}
              </div>
            </div>
          )}

          {markersData.length > 0 && (
            <div className={`mt-4 flex items-center justify-center gap-6 text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span>&lt; 10 visits</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                <span>10-20 visits</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span>&gt; 20 visits</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* City Details Modal */}
      {cityDetailsModal?.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-2xl w-full rounded-xl shadow-xl ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`flex justify-between items-center p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div>
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {cityDetailsModal.city}
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {cityDetailsModal.country}
                </p>
              </div>
              <button
                onClick={() => setCityDetailsModal(null)}
                className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {cityDetailsModal.visitors?.length > 0 ? (
                <div className="space-y-3">
                  {cityDetailsModal.visitors.map((visitor: any, idx: number) => (
                    <div key={idx} className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <Link href={visitor.pagePath} target="_blank" className={`text-sm font-medium hover:underline ${
                            isDarkMode ? 'text-blue-400' : 'text-blue-600'
                          }`}>
                            {visitor.pagePath}
                          </Link>
                          <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {formatDate(visitor.viewedAt)}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {visitor.deviceType || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No visitors found for this city in the selected period
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}