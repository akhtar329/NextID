
// app/admin/notifications/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  Check,
  Bell,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  CheckCheck,
} from "lucide-react";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJsonObject(response: Response): Promise<Record<string, unknown>> {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    throw new Error("Invalid response from server");
  }

  const data: unknown = await response.json();

  if (!isRecord(data)) {
    throw new Error("Invalid server response");
  }

  return data;
}

function parseNotification(value: unknown): Notification | null {
  if (!isRecord(value)) return null;

  if (
    typeof value.id !== "number" ||
    typeof value.title !== "string" ||
    typeof value.message !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    type: typeof value.type === "string" ? value.type : "general",
    title: value.title,
    message: value.message,
    time: typeof value.time === "string" ? value.time : "",
    read: value.read === true,
    link: typeof value.link === "string" ? value.link : undefined,
  };
}

function parseNotifications(value: unknown): Notification[] {
  if (!Array.isArray(value)) return [];

  return value
    .map(parseNotification)
    .filter((item): item is Notification => item !== null);
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const fetchNotifications = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError(null);

    try {
      const response = await fetch("/api/admin/notifications?limit=20", {
        method: "GET",
        credentials: "include",
      });

      const data = await readJsonObject(response);

      if (!response.ok || data.success !== true) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Failed to fetch notifications"
        );
      }

      setNotifications(parseNotifications(data.notifications));
    } catch (err) {
      console.error("Error fetching notifications:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while fetching notifications"
      );

      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();

  }, [fetchNotifications]);

  const markAsRead = async (id: number) => {
    if (markingId !== null) return;

    setMarkingId(id);
    setActionError(null);

    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId: id }),
      });

      const data = await readJsonObject(response);

      if (!response.ok || data.success !== true) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Failed to mark notification as read"
        );
      }

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);

      setActionError(
        err instanceof Error
          ? err.message
          : "Failed to mark notification as read"
      );
    } finally {
      setMarkingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="text-sm text-gray-500">
          Loading notifications...
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Notifications
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage your latest admin notifications
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void fetchNotifications(false)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>

            <div>
              <p className="text-sm text-gray-500">Total Notifications</p>
              <p className="text-2xl font-bold text-gray-900">
                {notifications.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2">
              <CheckCheck className="h-5 w-5 text-amber-600" />
            </div>

            <div>
              <p className="text-sm text-gray-500">Unread Notifications</p>
              <p className="text-2xl font-bold text-gray-900">
                {unreadCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ERRORS */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="flex-1">
            <p className="font-medium">{error}</p>

            <button
              type="button"
              onClick={() => void fetchNotifications()}
              className="mt-2 font-medium underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {actionError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {actionError}
        </div>
      )}

      {/* NOTIFICATIONS LIST */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-4 md:px-5">
          <div>
            <h2 className="font-semibold text-gray-900">
              Recent Notifications
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Showing latest {notifications.length} notifications
            </p>
          </div>

          {unreadCount > 0 && (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {unreadCount} unread
            </span>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <Bell className="h-7 w-7 text-gray-400" />
            </div>

            <h3 className="font-semibold text-gray-800">
              No notifications found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              You&apos;re all caught up. New notifications will appear here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((notification) => {
              const isMarking = markingId === notification.id;

              return (
                <li
                  key={notification.id}
                  className={`flex flex-col gap-4 p-4 transition-colors sm:flex-row sm:items-start sm:justify-between md:px-5 ${
                    notification.read
                      ? "bg-gray-50/70"
                      : "bg-white hover:bg-blue-50/30"
                  }`}
                >
                  <div className="flex min-w-0 flex-1 gap-3">
                    <div
                      className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        notification.read
                          ? "bg-gray-100 text-gray-500"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      <Bell className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {notification.title}
                        </h3>

                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-blue-600" />
                        )}

                        {notification.type && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase text-gray-500">
                            {notification.type.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-gray-600">
                        {notification.message}
                      </p>

                      <p className="mt-2 text-xs text-gray-400">
                        {notification.time
                          ? new Date(notification.time).toLocaleString()
                          : "Time unavailable"}
                      </p>

                      {notification.link && (
                        <a
                          href={notification.link}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          View details
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {!notification.read && (
                    <button
                      type="button"
                      onClick={() => void markAsRead(notification.id)}
                      disabled={markingId !== null}
                      title="Mark as read"
                      aria-label={`Mark ${notification.title} as read`}
                      className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50 sm:self-center"
                    >
                      {isMarking ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}

                      Mark as read
                    </button>
                  )}

                  {notification.read && (
                    <span className="inline-flex shrink-0 items-center gap-1 self-start text-xs font-medium text-gray-400 sm:self-center">
                      <CheckCheck className="h-4 w-4" />
                      Read
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
