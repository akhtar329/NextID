// app/admin/notifications/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Loader2, Check } from "lucide-react";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/notifications?limit=20", {
        method: "GET",
        credentials: "include", // 👈 cookie send ke liye zaruri
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to fetch notifications");
        setNotifications([]);
      } else {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      const data = await res.json();
      if (data.success) fetchNotifications();
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-600 font-medium">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>

      {notifications.length === 0 ? (
        <p>No notifications found.</p>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`p-4 border rounded flex justify-between items-center ${
                n.read ? "bg-gray-100" : "bg-white"
              }`}
            >
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-gray-600">{n.message}</p>
                <p className="text-xs text-gray-400">
                  {new Date(n.time).toLocaleString()}
                </p>
              </div>
              {!n.read && (
                <button
                  onClick={() => markAsRead(n.id)}
                  className="text-green-600 hover:text-green-800"
                  title="Mark as read"
                >
                  <Check className="h-5 w-5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}