import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  Briefcase,
  Award,
  Heart,
  Building2,
  Star,
} from "lucide-react";

interface Props {
  stats: any;
  filters: {
    level: string;
    city: string;
    q: string;
    showClosed: boolean;
  };
  buildUrl: (key: string, value: string) => string;
}

/* ---------------- PROGRAM TYPES ---------------- */

const getProgramTypes = (stats: any) => [
  {
    slug: "",
    name: "All Programs",
    icon: GraduationCap,
    count: stats?.programsByLevel?.total || 0,
  },
  {
    slug: "matric",
    name: "Matriculation",
    icon: BookOpen,
    count: stats?.programsByLevel?.matric || 0,
  },
  {
    slug: "inter",
    name: "Intermediate",
    icon: BookOpen,
    count: stats?.programsByLevel?.inter || 0,
  },
  {
    slug: "bs",
    name: "Bachelor",
    icon: GraduationCap,
    count: stats?.programsByLevel?.bs || 0,
  },
  {
    slug: "mba",
    name: "MBA",
    icon: Briefcase,
    count: stats?.programsByLevel?.mba || 0,
  },
  {
    slug: "ms",
    name: "Masters",
    icon: Award,
    count: stats?.programsByLevel?.ms || 0,
  },
  {
    slug: "medical",
    name: "Medical",
    icon: Heart,
    count: stats?.programsByLevel?.medical || 0,
  },
  {
    slug: "engineering",
    name: "Engineering",
    icon: Building2,
    count: stats?.programsByLevel?.engineering || 0,
  },
];

/* ---------------- COMPONENT ---------------- */

export default function AdmissionsSidebar({
  stats,
  filters,
  buildUrl,
}: Props) {
  const programTypes = getProgramTypes(stats);

  return (
    <div className="space-y-6 sticky top-24">

      {/* PROGRAM FILTERS */}
      <div className="bg-white border rounded-xl p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-indigo-600" />
          Programs
        </h3>

        <div className="space-y-1">
          {programTypes.map((p) => {
            const Icon = p.icon;
            const active = filters.level === p.slug;

            return (
              <Link
                key={p.slug}
                href={buildUrl("level", p.slug)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {p.name}
                </div>

                <span className="text-xs opacity-70">{p.count}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* STATS BOX */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-indigo-600" />
          <h3 className="font-semibold">Quick Stats</h3>
        </div>

        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex justify-between">
            <span>Active</span>
            <span className="font-medium">{stats?.total || 0}</span>
          </div>

          <div className="flex justify-between">
            <span>Closing Soon</span>
            <span className="font-medium">{stats?.closingSoon || 0}</span>
          </div>

          <div className="flex justify-between">
            <span>Universities</span>
            <span className="font-medium">{stats?.universities || 0}</span>
          </div>

          <div className="flex justify-between">
            <span>Cities</span>
            <span className="font-medium">{stats?.cities || 0}</span>
          </div>
        </div>
      </div>

      {/* HELP BOX */}
      <div className="bg-white border rounded-xl p-5">
        <h3 className="font-semibold mb-2">Need Help?</h3>
        <p className="text-sm text-gray-600 mb-4">
          Get guidance for admissions, eligibility and deadlines.
        </p>

        <button className="w-full bg-indigo-600 text-white text-sm py-2 rounded-lg hover:bg-indigo-700 transition">
          Contact Support
        </button>
      </div>

    </div>
  );
}