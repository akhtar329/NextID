import { db } from "@/app/lib/db";
import { news, programs, institutes, cities } from "@/app/lib/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import PrimaryButton from "@/app/component/ui/Button";
import {
  Calendar,
  User,
  Globe,
  Building,
  MapPin,
  Award,
  Zap,
  Eye,
} from "lucide-react";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function NewsDetailPage({ params }: PageProps) {
  const { id } = await params;
  const newsId = parseInt(id);

  if (isNaN(newsId)) notFound();

  const result = await db
    .select({
      id: news.id,
      title: news.title,
      slug: news.slug,
      content: news.content,
      excerpt: news.excerpt,
      imageUrl: news.imageUrl,
      source: news.source,
      author: news.author,
      isFeatured: news.isFeatured,
      isBreaking: news.isBreaking,
      views: news.viewCount,
      publishedAt: news.publishedAt,
      expiresAt: news.expiresAt,
      status: news.status,
      createdAt: news.createdAt,
      updatedAt: news.updatedAt,
      programName: programs.name,
      instituteName: institutes.name,
      cityName: cities.name,
      programId: news.programId,
      instituteId: news.instituteId,
      cityId: news.cityId,
    })
    .from(news)
    .leftJoin(programs, eq(news.programId, programs.id))
    .leftJoin(institutes, eq(news.instituteId, institutes.id))
    .leftJoin(cities, eq(news.cityId, cities.id))
    .where(eq(news.id, newsId))
    .limit(1);

  if (!result.length) notFound();

  const item = result[0];

  const formatDate = (date: Date | null) =>
    date
      ? new Date(date).toLocaleString("en-PK", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "Not set";

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 mb-1">News ID #{item.id}</p>
          <h1 className="text-3xl font-bold">{item.title}</h1>
          <p className="text-sm text-gray-500 mt-2">Slug: {item.slug}</p>
        </div>

        <div className="flex gap-2">
          <Link href={`/admin/news/${item.id}/edit`}>
            <PrimaryButton>Edit</PrimaryButton>
          </Link>
          <Link href="/admin/news">
            <PrimaryButton>Back</PrimaryButton>
          </Link>
        </div>
      </div>

      {/* Status Row */}
      <div className="flex flex-wrap gap-3">
        <span
          className={`px-4 py-1 rounded-full text-sm font-medium ${
            item.status
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {item.status ? "Active" : "Inactive"}
        </span>

        {item.isFeatured && (
          <span className="px-4 py-1 rounded-full text-sm bg-purple-100 text-purple-700 flex items-center gap-1">
            <Award size={14} /> Featured
          </span>
        )}

        {item.isBreaking && (
          <span className="px-4 py-1 rounded-full text-sm bg-red-100 text-red-700 flex items-center gap-1">
            <Zap size={14} /> Breaking
          </span>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Content Section */}
        <div className="lg:col-span-2 bg-white border rounded-xl shadow-sm">
          {item.imageUrl && (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-80 object-cover rounded-t-xl"
            />
          )}

          <div className="p-6 space-y-4">
            {item.excerpt && (
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                <p className="italic text-blue-800">{item.excerpt}</p>
              </div>
            )}

            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{item.content}</p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border rounded-xl shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-lg">Details</h3>

            {item.author && (
              <Meta icon={<User size={16} />} label="Author" value={item.author} />
            )}

            {item.source && (
              <Meta icon={<Globe size={16} />} label="Source" value={item.source} />
            )}

            <Meta
              icon={<Calendar size={16} />}
              label="Published"
              value={formatDate(item.publishedAt)}
            />

            <Meta
              icon={<Eye size={16} />}
              label="Views"
              value={String(item.views || 0)}
            />
          </div>

          {(item.programName || item.instituteName || item.cityName) && (
            <div className="bg-white border rounded-xl shadow-sm p-5 space-y-3">
              <h3 className="font-semibold text-lg">Related</h3>

              {item.programName && (
                <RelatedLink
                  href={`/admin/programs/${item.programId}`}
                  icon={<Building size={14} />}
                  label={item.programName}
                />
              )}

              {item.instituteName && (
                <RelatedLink
                  href={`/admin/institutes/${item.instituteId}`}
                  icon={<Building size={14} />}
                  label={item.instituteName}
                />
              )}

              {item.cityName && (
                <RelatedLink
                  href={`/admin/cities/${item.cityId}`}
                  icon={<MapPin size={14} />}
                  label={item.cityName}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Metadata */}
      <div className="text-xs text-gray-400 flex justify-between">
        <span>Created: {formatDate(item.createdAt)}</span>
        <span>Updated: {formatDate(item.updatedAt)}</span>
      </div>
    </div>
  );
}

function Meta({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="text-gray-500">{icon}</div>
      <div>
        <p className="text-gray-500 text-xs">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

function RelatedLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm"
    >
      {icon}
      {label}
    </Link>
  );
}
