// app/admin/settings/maintenance/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Wrench, 
  Power, 
  RefreshCw, 
  Shield, 
  Clock, 
  Globe,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";

interface MaintenanceSettings {
  isEnabled: boolean;
  title: string;
  message: string;
  estimatedTime: string;
  allowIps: string[];
}

export default function MaintenanceSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [settings, setSettings] = useState<MaintenanceSettings>({
    isEnabled: false,
    title: "Site Under Maintenance",
    message: "We are currently performing scheduled maintenance. Please check back soon.",
    estimatedTime: "2 hours",
    allowIps: [],
  });
  const [newIp, setNewIp] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/maintenance/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      setMessage("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    setSaving(true);
    try {
      const newState = !settings.isEnabled;
      const res = await fetch('/api/admin/maintenance/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newState }),
      });
      const data = await res.json();
      if (res.ok) {
        setSettings({ ...settings, isEnabled: newState });
        setMessage(data.message);
        
        // NO REDIRECT - just show message
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.error || 'Failed to toggle');
      }
    } catch (error) {
      setMessage("Failed to toggle maintenance mode");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/maintenance/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: settings.title,
          message: settings.message,
          estimatedTime: settings.estimatedTime,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      setMessage("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const addIp = async () => {
    if (!newIp.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/maintenance/ips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: newIp }),
      });
      const data = await res.json();
      if (res.ok) {
        setSettings({ ...settings, allowIps: [...settings.allowIps, newIp] });
        setNewIp("");
        setMessage("IP added successfully");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      setMessage("Failed to add IP");
    } finally {
      setSaving(false);
    }
  };

  const removeIp = async (ipToRemove: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/maintenance/ips', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: ipToRemove }),
      });
      const data = await res.json();
      if (res.ok) {
        setSettings({
          ...settings,
          allowIps: settings.allowIps.filter(ip => ip !== ipToRemove),
        });
        setMessage("IP removed successfully");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      setMessage("Failed to remove IP");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Wrench className="h-6 w-6 text-orange-500" />
              Maintenance Mode
            </h1>
            <p className="text-gray-500 mt-1">Control site accessibility during maintenance</p>
          </div>
          <Link
            href="/maintenance?preview=1"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
          >
            <Eye className="h-4 w-4" />
            Preview Page
          </Link>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`mb-6 rounded-xl p-4 ${
        settings.isEnabled 
          ? 'bg-orange-50 border border-orange-200' 
          : 'bg-green-50 border border-green-200'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {settings.isEnabled ? (
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            ) : (
              <CheckCircle className="h-8 w-8 text-green-500" />
            )}
            <div>
              <h3 className={`font-semibold ${
                settings.isEnabled ? 'text-orange-800' : 'text-green-800'
              }`}>
                {settings.isEnabled ? 'Maintenance Mode: ACTIVE' : 'Maintenance Mode: INACTIVE'}
              </h3>
              <p className={`text-sm ${
                settings.isEnabled ? 'text-orange-600' : 'text-green-600'
              }`}>
                {settings.isEnabled 
                  ? 'Visitors will see the maintenance page.'
                  : 'Site is fully accessible to all visitors.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggle}
            disabled={saving}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 shadow-md ${
              settings.isEnabled 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            } disabled:opacity-50`}
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Power className="h-4 w-4" />
            )}
            {settings.isEnabled ? 'Disable Maintenance' : 'Enable Maintenance'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column - Settings */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Maintenance Page Settings
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Page Title
                </label>
                <input
                  type="text"
                  value={settings.title}
                  onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Site Under Maintenance"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  rows={3}
                  value={settings.message}
                  onChange={(e) => setSettings({ ...settings, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="We are currently performing scheduled maintenance..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Downtime
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={settings.estimatedTime}
                    onChange={(e) => setSettings({ ...settings, estimatedTime: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="e.g., 2 hours, 30 minutes"
                  />
                  <Clock className="h-5 w-5 text-gray-400 self-center" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>

          {/* SEO Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-800">SEO Impact Notice</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  When maintenance mode is active, search engines will see a 503 status code 
                  and will not index the maintenance page. Your existing rankings will be preserved.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - IP Whitelist */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                IP Whitelist
              </h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Users from these IP addresses will have full access to the site even during maintenance.
              </p>
              
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  placeholder="Enter IP address (e.g., 192.168.1.1)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <button
                  onClick={addIp}
                  disabled={saving || !newIp.trim()}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition disabled:opacity-50"
                >
                  Add IP
                </button>
              </div>

              {settings.allowIps.length > 0 ? (
                <div className="space-y-2">
                  {settings.allowIps.map((ip) => (
                    <div key={ip} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="font-mono text-sm">{ip}</span>
                      </div>
                      <button
                        onClick={() => removeIp(ip)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No IPs whitelisted</p>
                  <p className="text-xs">Add IPs above to grant access during maintenance</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-800">Your Current IP</h4>
                <p className="text-sm text-blue-700 mt-1 font-mono">
                  {typeof window !== 'undefined' ? window.location.hostname : 'Loading...'}
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Add this IP to whitelist to access site during maintenance
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right-5">
          <div className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
            {message}
          </div>
        </div>
      )}
    </div>
  );
}
