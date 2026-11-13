
"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ChangeEvent,
} from "react";
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
  XCircle,
  Save,
  Plus,
  Loader2,
} from "lucide-react";

interface MaintenanceSettings {
  isEnabled: boolean;
  title: string;
  message: string;
  estimatedTime: string;
  allowIps: string[];
}

interface ApiResponse {
  success?: unknown;
  data?: unknown;
  message?: unknown;
  error?: unknown;
}

type MessageType = "success" | "error";

const DEFAULT_SETTINGS: MaintenanceSettings = {
  isEnabled: false,
  title: "Site Under Maintenance",
  message:
    "We are currently performing scheduled maintenance. Please check back soon.",
  estimatedTime: "2 hours",
  allowIps: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readApiResponse(response: Response): Promise<ApiResponse> {
  const result: unknown = await response.json();

  if (!isRecord(result)) {
    throw new Error("Invalid server response");
  }

  return result as ApiResponse;
}

function parseSettings(value: unknown): MaintenanceSettings | null {
  if (!isRecord(value)) return null;

  const {
    isEnabled,
    title,
    message,
    estimatedTime,
    allowIps,
  } = value;

  if (
    typeof isEnabled !== "boolean" ||
    typeof title !== "string" ||
    typeof message !== "string" ||
    typeof estimatedTime !== "string" ||
    !Array.isArray(allowIps) ||
    !allowIps.every((ip): ip is string => typeof ip === "string")
  ) {
    return null;
  }

  return {
    isEnabled,
    title,
    message,
    estimatedTime,
    allowIps,
  };
}

function getErrorMessage(
  data: ApiResponse,
  fallback: string
): string {
  return typeof data.error === "string" && data.error.trim()
    ? data.error
    : fallback;
}

export default function MaintenanceSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] =
    useState<MaintenanceSettings>(DEFAULT_SETTINGS);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<MessageType>("success");

  const [newIp, setNewIp] = useState("");

  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showMessage = useCallback(
    (text: string, type: MessageType = "success") => {
      if (messageTimer.current) {
        clearTimeout(messageTimer.current);
      }

      setMessage(text);
      setMessageType(type);

      messageTimer.current = setTimeout(() => {
        setMessage("");
        messageTimer.current = null;
      }, 4000);
    },
    []
  );

  const fetchSettings = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/admin/maintenance/settings", {
        method: "GET",
        cache: "no-store",
        signal,
      });

      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to load maintenance settings")
        );
      }

      if (data.success !== true) {
        throw new Error(
          getErrorMessage(data, "Unable to retrieve maintenance settings")
        );
      }

      const parsedSettings = parseSettings(data.data);

      if (!parsedSettings) {
        throw new Error("Invalid maintenance settings received from server");
      }

      setSettings(parsedSettings);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      console.error("Maintenance settings error:", error);

      showMessage(
        error instanceof Error
          ? error.message
          : "Failed to load settings",
        "error"
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [showMessage]);

  useEffect(() => {
    const controller = new AbortController();

    void fetchSettings(controller.signal);

    return () => {
      controller.abort();

      if (messageTimer.current) {
        clearTimeout(messageTimer.current);
        messageTimer.current = null;
      }
    };
  }, [fetchSettings]);

  const handleSettingChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    if (
      name !== "title" &&
      name !== "message" &&
      name !== "estimatedTime"
    ) {
      return;
    }

    setSettings((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleToggle = async () => {
    if (saving || loading) return;

    const nextState = !settings.isEnabled;

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/maintenance/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled: nextState,
        }),
      });

      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to toggle maintenance mode")
        );
      }

      setSettings((previous) => ({
        ...previous,
        isEnabled: nextState,
      }));

      showMessage(
        typeof data.message === "string"
          ? data.message
          : `Maintenance mode ${nextState ? "enabled" : "disabled"} successfully`
      );
    } catch (error) {
      console.error("Maintenance toggle error:", error);

      showMessage(
        error instanceof Error
          ? error.message
          : "Failed to toggle maintenance mode",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (saving) return;

    const title = settings.title.trim();
    const pageMessage = settings.message.trim();
    const estimatedTime = settings.estimatedTime.trim();

    if (!title || !pageMessage || !estimatedTime) {
      showMessage("Please complete all maintenance settings", "error");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/maintenance/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          message: pageMessage,
          estimatedTime,
        }),
      });

      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to save maintenance settings")
        );
      }

      setSettings((previous) => ({
        ...previous,
        title,
        message: pageMessage,
        estimatedTime,
      }));

      showMessage(
        typeof data.message === "string"
          ? data.message
          : "Maintenance settings saved successfully"
      );
    } catch (error) {
      console.error("Save maintenance settings error:", error);

      showMessage(
        error instanceof Error
          ? error.message
          : "Failed to save settings",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const addIp = async () => {
    const ip = newIp.trim();

    if (!ip || saving) return;

    if (settings.allowIps.includes(ip)) {
      showMessage("This IP address is already whitelisted", "error");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/maintenance/ips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ip }),
      });

      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to add IP address")
        );
      }

      setSettings((previous) => ({
        ...previous,
        allowIps: previous.allowIps.includes(ip)
          ? previous.allowIps
          : [...previous.allowIps, ip],
      }));

      setNewIp("");
      showMessage(
        typeof data.message === "string"
          ? data.message
          : "IP address added successfully"
      );
    } catch (error) {
      console.error("Add IP error:", error);

      showMessage(
        error instanceof Error ? error.message : "Failed to add IP",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const removeIp = async (ipToRemove: string) => {
    if (saving) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove ${ipToRemove} from the whitelist?`
    );

    if (!confirmed) return;

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/maintenance/ips", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ip: ipToRemove,
        }),
      });

      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to remove IP address")
        );
      }

      setSettings((previous) => ({
        ...previous,
        allowIps: previous.allowIps.filter(
          (ip) => ip !== ipToRemove
        ),
      }));

      showMessage(
        typeof data.message === "string"
          ? data.message
          : "IP address removed successfully"
      );
    } catch (error) {
      console.error("Remove IP error:", error);

      showMessage(
        error instanceof Error ? error.message : "Failed to remove IP",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-9 w-9 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">
            Loading maintenance settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
              <Wrench className="h-5 w-5 text-orange-600" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Maintenance Mode
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Control site accessibility during maintenance.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/maintenance?preview=1"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          <Eye className="h-4 w-4" />
          Preview Page
        </Link>
      </div>

      {/* Status Banner */}
      <div
        className={`rounded-2xl border p-5 ${
          settings.isEnabled
            ? "border-orange-200 bg-orange-50"
            : "border-green-200 bg-green-50"
        }`}
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            {settings.isEnabled ? (
              <AlertTriangle className="h-9 w-9 shrink-0 text-orange-600" />
            ) : (
              <CheckCircle className="h-9 w-9 shrink-0 text-green-600" />
            )}

            <div>
              <h3
                className={`font-semibold ${
                  settings.isEnabled
                    ? "text-orange-900"
                    : "text-green-900"
                }`}
              >
                Maintenance Mode: {settings.isEnabled ? "ACTIVE" : "INACTIVE"}
              </h3>

              <p
                className={`mt-1 text-sm ${
                  settings.isEnabled
                    ? "text-orange-700"
                    : "text-green-700"
                }`}
              >
                {settings.isEnabled
                  ? "Visitors will see the maintenance page, except permitted IP addresses."
                  : "Your website is accessible to visitors."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggle}
            disabled={saving}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
              settings.isEnabled
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Power className="h-4 w-4" />
            )}

            {saving
              ? "Updating..."
              : settings.isEnabled
                ? "Disable Maintenance"
                : "Enable Maintenance"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Maintenance Page Settings */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-6 py-4">
              <Globe className="h-5 w-5 text-gray-600" />
              <div>
                <h2 className="font-semibold text-gray-900">
                  Maintenance Page Settings
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Customize what visitors see during maintenance.
                </p>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label
                  htmlFor="maintenance-title"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Page Title
                </label>

                <input
                  id="maintenance-title"
                  name="title"
                  type="text"
                  value={settings.title}
                  onChange={handleSettingChange}
                  maxLength={150}
                  disabled={saving}
                  placeholder="Site Under Maintenance"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label
                  htmlFor="maintenance-message"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Maintenance Message
                </label>

                <textarea
                  id="maintenance-message"
                  name="message"
                  rows={4}
                  value={settings.message}
                  onChange={handleSettingChange}
                  maxLength={2000}
                  disabled={saving}
                  placeholder="We are currently performing scheduled maintenance..."
                  className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50"
                />

                <p className="mt-1 text-right text-xs text-gray-400">
                  {settings.message.length}/2000
                </p>
              </div>

              <div>
                <label
                  htmlFor="maintenance-time"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Estimated Downtime
                </label>

                <div className="relative">
                  <input
                    id="maintenance-time"
                    name="estimatedTime"
                    type="text"
                    value={settings.estimatedTime}
                    onChange={handleSettingChange}
                    maxLength={100}
                    disabled={saving}
                    placeholder="e.g. 2 hours, 30 minutes"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50"
                  />

                  <Clock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-100 bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                Save Settings
              </button>
            </div>
          </div>

          {/* SEO Notice */}
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />

              <div>
                <h4 className="font-semibold text-yellow-900">
                  SEO Impact Notice
                </h4>

                <p className="mt-1 text-sm leading-6 text-yellow-800">
                  Maintenance mode should return HTTP 503 with a
                  temporary maintenance response. This helps search
                  engines understand that the downtime is temporary.
                  Actual SEO behavior depends on the server response
                  and how long maintenance remains active.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* IP Whitelist */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-6 py-4">
              <Shield className="h-5 w-5 text-gray-600" />

              <div>
                <h2 className="font-semibold text-gray-900">
                  IP Whitelist
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Allow selected IP addresses during maintenance.
                </p>
              </div>

              <span className="ml-auto rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700">
                {settings.allowIps.length}
              </span>
            </div>

            <div className="p-6">
              <p className="mb-4 text-sm leading-6 text-gray-600">
                Users connecting from these IP addresses can access
                the website even when maintenance mode is enabled.
              </p>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void addIp();
                }}
                className="mb-6 flex flex-col gap-3 sm:flex-row"
              >
                <input
                  type="text"
                  value={newIp}
                  onChange={(event) => setNewIp(event.target.value)}
                  disabled={saving}
                  placeholder="Enter IPv4 or IPv6 address"
                  aria-label="IP address"
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2.5 font-mono text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50"
                />

                <button
                  type="submit"
                  disabled={saving || !newIp.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add IP
                </button>
              </form>

              {settings.allowIps.length > 0 ? (
                <div className="space-y-2">
                  {settings.allowIps.map((ip) => (
                    <div
                      key={ip}
                      className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <Shield className="h-4 w-4 shrink-0 text-green-600" />
                        <span className="break-all font-mono text-sm text-gray-800">
                          {ip}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => void removeIp(ip)}
                        disabled={saving}
                        aria-label={`Remove ${ip}`}
                        title="Remove IP"
                        className="shrink-0 rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center">
                  <Shield className="mx-auto mb-3 h-10 w-10 text-gray-300" />

                  <p className="text-sm font-medium text-gray-600">
                    No IP addresses whitelisted
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Add an IP address to grant access during maintenance.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* IP Information */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>

              <div>
                <h4 className="font-semibold text-blue-900">
                  IP Whitelist Information
                </h4>

                <p className="mt-1 text-sm leading-6 text-blue-800">
                  Add the public IP address of the person or network
                  that needs access during maintenance. Your website
                  hostname is not an IP address.
                </p>

                <p className="mt-2 text-xs leading-5 text-blue-700">
                  If your site is behind Cloudflare, the server must
                  use the trusted client IP header correctly. Do not
                  trust arbitrary forwarded IP headers from visitors.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Message */}
      {message && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-50 flex max-w-[calc(100%-2.5rem)] items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${
            messageType === "success"
              ? "border-green-200 bg-white text-green-800"
              : "border-red-200 bg-white text-red-800"
          }`}
        >
          {messageType === "success" ? (
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
          ) : (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          )}

          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
