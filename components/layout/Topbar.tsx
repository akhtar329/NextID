
"use client";

import {
  Menu,
  Bell,
  LogOut,
  Settings,
  UserCircle,
  ChevronDown,
  Search,
  Moon,
  Sun,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface TopbarProps {
  onMenuClick: () => void;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface RawNotification {
  id: number;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  link?: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function parseUser(value: unknown): UserData | null {
  if (!isRecord(value)) return null;

  if (
    typeof value.id !== "number" ||
    typeof value.name !== "string" ||
    typeof value.email !== "string" ||
    typeof value.role !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    email: value.email,
    role: value.role,
    avatar: typeof value.avatar === "string" ? value.avatar : undefined,
  };
}

function parseNotification(value: unknown): RawNotification | null {
  if (!isRecord(value)) return null;

  if (
    typeof value.id !== "number" ||
    typeof value.title !== "string" ||
    typeof value.message !== "string" ||
    typeof value.createdAt !== "string" ||
    typeof value.read !== "boolean"
  ) {
    return null;
  }

  return {
    id: value.id,
    title: value.title,
    message: value.message,
    createdAt: value.createdAt,
    read: value.read,
    link: typeof value.link === "string" ? value.link : undefined,
  };
}

function parseNotifications(value: unknown): RawNotification[] {
  if (!Array.isArray(value)) return [];

  return value
    .map(parseNotification)
    .filter((item): item is RawNotification => item !== null);
}

function safeNotificationLink(link?: string): string {
  if (!link) return "/admin/notifications";

  // Allow internal relative paths only, or trusted HTTP(S) URLs.
  if (link.startsWith("/") && !link.startsWith("//")) {
    return link;
  }

  try {
    const parsed = new URL(link);

    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
  } catch {
    // Invalid URL falls back to notifications page.
  }

  return "/admin/notifications";
}

function formatTimeAgo(dateString: string): string {
  if (!dateString) return "Just now";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "Unknown";

  const diffMs = Date.now() - date.getTime();

  if (diffMs < 0) return "Just now";

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  }
  if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  }

  return date.toLocaleDateString();
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<UserData | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Restore dark mode after hydration.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("darkMode");
      setDarkMode(saved === "true");
    } catch (error) {
      console.error("Unable to restore theme preference:", error);
    }
  }, []);

  // Sync dark mode class with state.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Fetch user data.
  useEffect(() => {
    let active = true;

    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/admin/profile", {
          credentials: "include",
          cache: "no-store",
        });

        if (!active) return;

        if (response.status === 401 || response.status === 403) {
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(`Profile request failed (${response.status})`);
        }

        const rawData: unknown = await response.json();

        if (!active) return;

        const profile =
          isRecord(rawData) ? parseUser(rawData.profile) : null;

        if (profile) {
          setUser(profile);
        }
      } catch (error) {
        if (active) {
          console.error("Error fetching user:", error);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchUserData();

    return () => {
      active = false;
    };
  }, [router]);

  // Fetch and poll notifications.
  useEffect(() => {
    let active = true;

    const fetchNotifications = async () => {
      try {
        const response = await fetch("/api/admin/notifications", {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) return;

        const rawData: unknown = await response.json();

        if (!active || !isRecord(rawData)) return;

        const rawNotifications = parseNotifications(rawData.notifications);

        const formattedNotifications: Notification[] =
          rawNotifications.map((notification) => ({
            id: notification.id,
            title: notification.title,
            message: notification.message,
            time: formatTimeAgo(notification.createdAt),
            read: notification.read,
            link: notification.link,
          }));

        setNotifications(formattedNotifications);
        setUnreadCount(
          formattedNotifications.filter((item) => !item.read).length
        );
      } catch (error) {
        if (active) {
          console.error("Error fetching notifications:", error);
        }
      }
    };

    void fetchNotifications();

    const interval = window.setInterval(() => {
      void fetchNotifications();
    }, 30000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  // Close dropdowns when clicking outside.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) return;

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setShowDropdown(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(target)
      ) {
        setShowNotifications(false);
      }

      if (
        searchRef.current &&
        !searchRef.current.contains(target)
      ) {
        setShowSearch(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Logout.
  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Logout failed (${response.status})`);
      }

      try {
        localStorage.removeItem("darkMode");
      } catch (error) {
        console.error("Unable to clear theme preference:", error);
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      router.replace("/login");
    }
  };

  // Toggle dark mode.
  const toggleDarkMode = () => {
    setDarkMode((previous) => {
      const next = !previous;

      try {
        localStorage.setItem("darkMode", String(next));
      } catch (error) {
        console.error("Unable to save theme preference:", error);
      }

      return next;
    });
  };

  // Search.
  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = searchQuery.trim();

    if (!query) return;

    router.push(`/admin/search?q=${encodeURIComponent(query)}`);
    setShowSearch(false);
    setSearchQuery("");
  };

  // Mark one notification as read.
  const markAsRead = async (notificationId: number) => {
    const notification = notifications.find(
      (item) => item.id === notificationId
    );

    if (!notification || notification.read) return;

    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationId,
          action: "markRead",
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to mark notification as read");
      }

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notificationId
            ? { ...item, read: true }
            : item
        )
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read.
  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/admin/notifications/read-all", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Unable to mark all notifications as read");
      }

      setNotifications((previous) =>
        previous.map((item) => ({ ...item, read: true }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Clear all notifications.
  const clearAllNotifications = async () => {
    try {
      const response = await fetch("/api/admin/notifications/clear-all", {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Unable to clear notifications");
      }

      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  // User initials.
  const getUserInitials = () => {
    if (!user?.name) return "A";

    return user.name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-700 h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 shadow-sm transition-colors">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden transition-colors"
          aria-label="Toggle menu"
        >
          <Menu size={20} className="text-gray-600 dark:text-gray-400" />
        </button>

        <div className="hidden md:block">
          <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Manage your content
          </p>
        </div>

        <div className="md:hidden">
          <h1 className="text-base font-semibold text-gray-800 dark:text-white">
            Dashboard
          </h1>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Search */}
        <div className="relative" ref={searchRef}>
          <button
            type="button"
            onClick={() => setShowSearch((previous) => !previous)}
            aria-expanded={showSearch}
            aria-label="Search"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Search size={20} className="text-gray-600 dark:text-gray-400" />
          </button>

          {showSearch && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 z-50 overflow-hidden">
              <form onSubmit={handleSearch} className="p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search posts, users..."
                    aria-label="Search posts and users"
                    className="flex-1 min-w-0 px-3 py-2 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />

                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    Go
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Dark Mode */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={darkMode ? "Enable light mode" : "Enable dark mode"}
        >
          {darkMode ? (
            <Sun size={20} className="text-yellow-500" />
          ) : (
            <Moon size={20} className="text-gray-600 dark:text-gray-400" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() =>
              setShowNotifications((previous) => !previous)
            }
            aria-expanded={showNotifications}
            aria-label={`Notifications, ${unreadCount} unread`}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 relative transition-colors"
          >
            <Bell size={20} className="text-gray-600 dark:text-gray-400" />

            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 z-50 overflow-hidden">
              <div className="p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    Notifications
                  </h3>

                  <div className="flex gap-2">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => void markAllAsRead()}
                        className="text-xs text-blue-600 hover:text-blue-700 whitespace-nowrap"
                      >
                        Mark all read
                      </button>
                    )}

                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={() => void clearAllNotifications()}
                        className="text-xs text-red-600 hover:text-red-700 whitespace-nowrap"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  You have {unreadCount} unread notifications
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <Link
                      key={notification.id}
                      href={safeNotificationLink(notification.link)}
                      onClick={() => {
                        void markAsRead(notification.id);
                        setShowNotifications(false);
                      }}
                      className={`block p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                        !notification.read
                          ? "bg-blue-50/30 dark:bg-blue-900/20"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            !notification.read
                              ? "bg-blue-500"
                              : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        />

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-white">
                            {notification.title}
                          </p>

                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>

                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                    <Bell size={32} className="mx-auto mb-2 opacity-50" />
                    No notifications
                  </div>
                )}
              </div>

              <div className="p-2 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-center">
                <Link
                  href="/admin/notifications"
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  onClick={() => setShowNotifications(false)}
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown((previous) => !previous)}
            aria-expanded={showDropdown}
            aria-label="User menu"
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-sm overflow-hidden">
              {user?.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name}
                  width={32}
                  height={32}
                  className="rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-medium text-sm">
                  {loading ? "..." : getUserInitials()}
                </span>
              )}
            </div>

            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-800 dark:text-white">
                {loading ? "Loading..." : user?.name || "Admin User"}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {loading ? "..." : user?.role || "Administrator"}
              </p>
            </div>

            <ChevronDown
              size={16}
              className="text-gray-400 dark:text-gray-500 hidden md:block"
            />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 z-50 overflow-hidden">
              <div className="p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <p className="font-medium text-gray-800 dark:text-white">
                  {user?.name || "Admin User"}
                </p>

                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email || "admin@nextid.pk"}
                </p>
              </div>

              <div className="py-1">
                <Link
                  href="/admin/profile"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  onClick={() => setShowDropdown(false)}
                >
                  <UserCircle size={16} />
                  Profile
                </Link>

                <Link
                  href="/admin/settings"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  onClick={() => setShowDropdown(false)}
                >
                  <Settings size={16} />
                  Settings
                </Link>
              </div>

              <div className="border-t dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
