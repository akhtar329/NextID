"use client";

import { useEffect, useState } from "react";

interface EditorStats {
  name: string;
  created: number;
  published: number;
  draft: number;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  const [contentStats, setContentStats] = useState<any>(null);
  const [weeklyStats, setWeeklyStats] = useState<any>(null);
  const [targets, setTargets] = useState<any>(null);
  const [editors, setEditors] = useState<EditorStats[]>([]);

  // 🔥 REAL API CALL
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/admin/dashboard");
        const data = await res.json();

        setContentStats(data.contentStats);
        setWeeklyStats(data.weeklyStats);
        setTargets(data.targets);
        setEditors(data.editors);
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderGap = (key: string) => {
    if (!weeklyStats || !targets) return null;

    const actual = weeklyStats[key];
    const target = targets[key];
    const ok = actual >= target;

    return (
      <div className="flex justify-between text-sm py-1">
        <span className="capitalize">{key}</span>
        <span className={ok ? "text-green-600" : "text-red-600"}>
          {actual} / {target} {ok ? "✔" : "❌"}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        Loading Admin Dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* CONTENT INVENTORY */}
      <section className="bg-white p-5 rounded-xl shadow">
        <h2 className="font-bold mb-3">Content Inventory</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>Jobs <br /><b>{contentStats?.jobs}</b></div>
          <div>Results <br /><b>{contentStats?.results}</b></div>
          <div>Admissions <br /><b>{contentStats?.admissions}</b></div>
          <div>Scholarships <br /><b>{contentStats?.scholarships}</b></div>
        </div>
      </section>

      {/* WEEKLY */}
      <section className="bg-white p-5 rounded-xl shadow">
        <h2 className="font-bold mb-3">This Week Production</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>Jobs <br /><b>{weeklyStats?.jobs}</b></div>
          <div>Results <br /><b>{weeklyStats?.results}</b></div>
          <div>Admissions <br /><b>{weeklyStats?.admissions}</b></div>
          <div>Scholarships <br /><b>{weeklyStats?.scholarships}</b></div>
        </div>
      </section>

      {/* TARGET */}
      <section className="bg-white p-5 rounded-xl shadow">
        <h2 className="font-bold mb-3">Target vs Actual</h2>
        {renderGap("jobs")}
        {renderGap("results")}
        {renderGap("admissions")}
        {renderGap("scholarships")}
      </section>

      {/* EDITORS */}
      <section className="bg-white p-5 rounded-xl shadow overflow-x-auto">
        <h2 className="font-bold mb-3">Editor Performance</h2>

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
            {editors.map((e) => (
              <tr key={e.name} className="border-b">
                <td className="p-2">{e.name}</td>
                <td className="p-2">{e.created}</td>
                <td className="p-2">{e.published}</td>
                <td className="p-2">{e.draft}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

    </div>
  );
}