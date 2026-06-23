"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
} from "lucide-react";

interface User {
  name: string;
  role: "Admin" | "Editor";
}

interface DashboardData {
  totalPosts: number;
  published: number;
  drafts: number;
  editors: number;
  weeklyGrowth: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/dashboard");

        if (!res.ok) {
          router.push("/login");
          return;
        }

        const json = await res.json();

        setUser(json.user);
        setData(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!user || !data) return null;

  const cards = [
    {
      title: "Total Posts",
      value: data.totalPosts,
      icon: FileText,
      color: "blue",
    },
    {
      title: "Published",
      value: data.published,
      icon: CheckCircle,
      color: "green",
    },
    {
      title: "Drafts",
      value: data.drafts,
      icon: Clock,
      color: "orange",
    },
    {
      title: "Editors",
      value: data.editors,
      icon: Users,
      color: "purple",
    },
    {
      title: "Weekly Growth",
      value: `${data.weeklyGrowth}%`,
      icon: BarChart3,
      color: "indigo",
    },
  ];

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500">
          Welcome {user.name} ({user.role})
        </p>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="p-4 bg-white border rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-xl font-bold">{card.value}</p>
              </div>

              <card.icon className="text-gray-600" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}