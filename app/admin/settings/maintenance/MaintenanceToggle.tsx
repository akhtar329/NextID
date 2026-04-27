// app/admin/settings/maintenance/MaintenanceToggle.tsx
"use client";

import { useState } from "react";

export default function MaintenanceToggle() {
  const [loading, setLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [message, setMessage] = useState("");

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/maintenance/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !isEnabled }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setIsEnabled(!isEnabled);
        setMessage(data.message);
        
        // Agar disable kiya hai to homepage par redirect
        if (!isEnabled) {
          window.location.href = '/';
        } else {
          setTimeout(() => setMessage(''), 3000);
        }
      } else {
        setMessage(data.error || 'Failed to toggle');
      }
    } catch {
      setMessage('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">
            {isEnabled ? 'Maintenance Mode: ON' : 'Maintenance Mode: OFF'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {isEnabled 
              ? 'Site is currently under maintenance' 
              : 'Site is accessible to everyone'}
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            isEnabled 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          } disabled:opacity-50`}
        >
          {loading ? 'Updating...' : (isEnabled ? 'Disable' : 'Enable')}
        </button>
      </div>
      {message && (
        <div className="mt-3 p-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
          {message}
        </div>
      )}
    </div>
  );
}