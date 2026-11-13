
"use client";

import { useEffect, useState } from "react";

interface EditorStats {
  name: string;
  created: number;
  published: number;
  draft: number;
}

type ContentCategory = "jobs" | "results" | "admissions" | "scholarships";

interface CategoryStats {
  jobs: number;
  results: number;
  admissions: number;
  scholarships: number;
}

interface DashboardData {
  contentStats: CategoryStats;
  weeklyStats: CategoryStats;
  targets: CategoryStats;
  editors: EditorStats[];
}

const DEFAULT_STATS: CategoryStats = {
  jobs: 0,
  results: 0,
  admissions: 0,
  scholarships: 0,
};

const CATEGORIES: ContentCategory[] = [
  "jobs",
  "results",
  "admissions",
  "scholarships",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNumber(value: unknown): number {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
    ? value
    : 0;
}

function parseCategoryStats(value: unknown): CategoryStats {
  if (!isRecord(value)) {
    return { ...DEFAULT_STATS };
  }

  return {
    jobs: getNumber(value.jobs),
    results: getNumber(value.results),
    admissions: getNumber(value.admissions),
    scholarships: getNumber(value.scholarships),
  };
}

function parseEditors(value: unknown): EditorStats[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord).map((editor) => ({
    name:
      typeof editor.name === "string" && editor.name.trim()
        ? editor.name.trim()
        : "Unknown Editor",
    created: getNumber(editor.created),
    published: getNumber(editor.published),
    draft: getNumber(editor.draft),
  }));
}

function parseDashboardData(value: unknown): DashboardData {
  if (!isRecord(value)) {
    throw new Error("Invalid dashboard response");
  }

  return {
    contentStats: parseCategoryStats(value.contentStats),
    weeklyStats: parseCategoryStats(value.weeklyStats),
    targets: parseCategoryStats(value.targets),
    editors: parseEditors(value.editors),
  };
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [contentStats, setContentStats] =
    useState<CategoryStats>(DEFAULT_STATS);
  const [weeklyStats, setWeeklyStats] =
    useState<CategoryStats>(DEFAULT_STATS);
  const [targets, setTargets] =
    useState<CategoryStats>(DEFAULT_STATS);
  const [editors, setEditors] = useState<EditorStats[]>([]);

  // ==================== FETCH DASHBOARD DATA ====================

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const response = await fetch("/api/admin/dashboard", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            response.status === 401 || response.status === 403
              ? "You are not authorized to view dashboard data."
              : "Unable to load dashboard data."
          );
        }

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.toLowerCase().includes("application/json")) {
          throw new Error("Invalid response received from server.");
        }

        const rawData: unknown = await response.json();
        const data = parseDashboardData(rawData);

        setContentStats(data.contentStats);
        setWeeklyStats(data.weeklyStats);
        setTargets(data.targets);
        setEditors(data.editors);
        setError("");
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        console.error("Dashboard error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading dashboard."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      controller.abort();
    };
  }, []);

  // ==================== TARGET COMPARISON ====================

  const renderGap = (key: ContentCategory) => {
    const actual = weeklyStats[key];
    const target = targets[key];
    const achieved = actual >= target;

    return (
      <div
        key={key}
        className="flex justify-between text-sm py-1"
      >
        <span className="capitalize">{key}</span>

        <span
          className={
            achieved ? "text-green-600" : "text-red-600"
          }
        >
          {actual.toLocaleString()} / {target.toLocaleString()}{" "}
          {achieved ? "✔" : "❌"}
        </span>
      </div>
    );
  };

  // ==================== LOADING ====================

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        Loading Admin Dashboard...
      </div>
    );
  }

  // ==================== ERROR ====================

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl shadow text-center">
        <h2 className="text-lg font-bold text-red-600">
          Dashboard Error
        </h2>

        <p className="text-sm text-gray-600 mt-2">
          {error}
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ==================== MAIN DASHBOARD ====================

  return (
    <div className="space-y-8">
      {/* CONTENT INVENTORY */}
      <section className="bg-white p-5 rounded-xl shadow">
        <h2 className="font-bold mb-3">Content Inventory</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            Jobs
            <br />
            <b>{contentStats.jobs.toLocaleString()}</b>
          </div>

          <div>
            Results
            <br />
            <b>{contentStats.results.toLocaleString()}</b>
          </div>

          <div>
            Admissions
            <br />
            <b>{contentStats.admissions.toLocaleString()}</b>
          </div>

          <div>
            Scholarships
            <br />
            <b>{contentStats.scholarships.toLocaleString()}</b>
          </div>
        </div>
      </section>

      {/* WEEKLY */}
      <section className="bg-white p-5 rounded-xl shadow">
        <h2 className="font-bold mb-3">
          This Week Production
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            Jobs
            <br />
            <b>{weeklyStats.jobs.toLocaleString()}</b>
          </div>

          <div>
            Results
            <br />
            <b>{weeklyStats.results.toLocaleString()}</b>
          </div>

          <div>
            Admissions
            <br />
            <b>{weeklyStats.admissions.toLocaleString()}</b>
          </div>

          <div>
            Scholarships
            <br />
            <b>{weeklyStats.scholarships.toLocaleString()}</b>
          </div>
        </div>
      </section>

      {/* TARGET */}
      <section className="bg-white p-5 rounded-xl shadow">
        <h2 className="font-bold mb-3">
          Target vs Actual
        </h2>

        {CATEGORIES.map((category) => renderGap(category))}
      </section>

      {/* EDITORS */}
      <section className="bg-white p-5 rounded-xl shadow overflow-x-auto">
        <h2 className="font-bold mb-3">
          Editor Performance
        </h2>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">Editor</th>
              <th className="p-2">Created</th>
              <th className="p-2">Published</th>
              <th className="p-2">Draft</th>
            </tr>
          </thead>

          <tbody>
            {editors.length > 0 ? (
              editors.map((editor, index) => (
                <tr
                  key={`${editor.name}-${index}`}
                  className="border-b"
                >
                  <td className="p-2">{editor.name}</td>

                  <td className="p-2">
                    {editor.created.toLocaleString()}
                  </td>

                  <td className="p-2">
                    {editor.published.toLocaleString()}
                  </td>

                  <td className="p-2">
                    {editor.draft.toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="p-6 text-center text-gray-500"
                >
                  No editor data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
