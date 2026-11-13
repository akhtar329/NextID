
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Wrench,
} from "lucide-react";

interface ApiResponse {
  enabled?: unknown;
  message?: unknown;
  error?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readApiResponse(response: Response): Promise<ApiResponse> {
  const data: unknown = await response.json();

  if (!isRecord(data)) {
    throw new Error("Invalid server response");
  }

  return data as ApiResponse;
}

export default function MaintenanceToggle() {
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showMessage = useCallback(
    (text: string, type: "success" | "error") => {
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

  useEffect(() => {
    const controller = new AbortController();

    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/admin/maintenance/settings", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        const data = await readApiResponse(response);

        if (!response.ok) {
          throw new Error(
            typeof data.error === "string"
              ? data.error
              : "Failed to load maintenance status"
          );
        }

        if (typeof data.enabled !== "boolean") {
          throw new Error("Maintenance status is missing from server response");
        }

        setIsEnabled(data.enabled);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error("Maintenance status error:", error);

        showMessage(
          error instanceof Error
            ? error.message
            : "Failed to load maintenance status",
          "error"
        );
      } finally {
        if (!controller.signal.aborted) {
          setStatusLoading(false);
        }
      }
    };

    void fetchStatus();

    return () => {
      controller.abort();

      if (messageTimer.current) {
        clearTimeout(messageTimer.current);
        messageTimer.current = null;
      }
    };
  }, [showMessage]);

  const handleToggle = async () => {
    if (loading || statusLoading) return;

    const nextEnabled = !isEnabled;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/maintenance/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled: nextEnabled,
        }),
      });

      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Failed to update maintenance mode"
        );
      }

      setIsEnabled(nextEnabled);

      showMessage(
        typeof data.message === "string"
          ? data.message
          : `Maintenance mode ${nextEnabled ? "enabled" : "disabled"} successfully`,
        "success"
      );

      // Maintenance enable hone ke baad homepage par redirect.
      if (nextEnabled) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Maintenance toggle error:", error);

      showMessage(
        error instanceof Error
          ? error.message
          : "Network error. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              isEnabled ? "bg-red-50" : "bg-green-50"
            }`}
          >
            <Wrench
              className={`h-5 w-5 ${
                isEnabled ? "text-red-600" : "text-green-600"
              }`}
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-gray-900">
                Maintenance Mode
              </h3>

              {!statusLoading && (
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    isEnabled
                      ? "bg-red-50 text-red-700"
                      : "bg-green-50 text-green-700"
                  }`}
                >
                  {isEnabled ? "ON" : "OFF"}
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-gray-500">
              {statusLoading
                ? "Checking current maintenance status..."
                : isEnabled
                  ? "The website is currently under maintenance."
                  : "The website is accessible to visitors."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          disabled={loading || statusLoading}
          className={`inline-flex min-w-[130px] items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
            isEnabled
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {loading || statusLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {statusLoading ? "Loading..." : "Updating..."}
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              {isEnabled ? "Disable" : "Enable"}
            </>
          )}
        </button>
      </div>

      {message && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-start gap-2 border-t px-5 py-3 text-sm ${
            messageType === "success"
              ? "border-green-100 bg-green-50 text-green-700"
              : "border-red-100 bg-red-50 text-red-700"
          }`}
        >
          {messageType === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}

          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
