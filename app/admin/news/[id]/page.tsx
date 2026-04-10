// app/admin/news/[id]/page.tsx

import { db } from "@/app/lib/db";
import { news, programs, institutes, cities, seoMetadata } from "@/app/lib/schema";
import { eq, and } from "drizzle-orm";
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
  Search,
  Twitter,
  Facebook,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

type PageProps = {
  params: Promise<{ id: string }>;
};

// ✅ Google standards ke mutabiq character limits
const META_TITLE_MAX = 60;
const META_DESC_MAX = 160;
const TITLE_MAX = 120;  // News title ki limit
const EXCERPT_MAX = 200;

// ✅ Character limit color function
function getCharacterLimitColor(length: number, max: number): string {
  const percentage = (length / max) * 100;
  if (percentage >= 95) return "text-red-600 bg-red-50";  // Red - Exceeds/Almost exceeds
  if (percentage >= 80) return "text-yellow-600 bg-yellow-50"; // Yellow - Getting long
  if (percentage >= 10) return "text-green-600 bg-green-50"; // Green - Good range
  return "text-gray-400 bg-gray-50"; // Gray - Too short (not enough content)
}

function getCharacterLimitIcon(length: number, max: number) {
  const percentage = (length / max) * 100;
  if (percentage >= 95) return <AlertCircle className="w-3 h-3 text-red-500" />;
  if (percentage >= 80) return <AlertTriangle className="w-3 h-3 text-yellow-500" />;
  if (percentage >= 10) return <CheckCircle className="w-3 h-3 text-green-500" />;
  return null;
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { id } = await params;
  const newsId = parseInt(id);

  if (isNaN(newsId)) notFound();

  // ✅ Fetch news with relations
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
      viewCount: news.viewCount,
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

  // ✅ Fetch SEO metadata
  const seoData = await db
    .select()
    .from(seoMetadata)
    .where(
      and(
        eq(seoMetadata.entityId, newsId),
        eq(seoMetadata.entityType, "news")
      )
    )
    .limit(1);

  const seo = seoData.length > 0 ? seoData[0] : null;

  const formatDate = (date: Date | null) =>
    date
      ? new Date(date).toLocaleString("en-PK", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "Not set";

  // ✅ Calculate character limit status
  const titleStatus = getCharacterLimitColor(item.title?.length || 0, TITLE_MAX);
  const excerptStatus = getCharacterLimitColor(item.excerpt?.length || 0, EXCERPT_MAX);
  const metaTitleStatus = getCharacterLimitColor(seo?.metaTitle?.length || 0, META_TITLE_MAX);
  const metaDescStatus = getCharacterLimitColor(seo?.metaDescription?.length || 0, META_DESC_MAX);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 mb-1">News ID #{item.id}</p>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold">{item.title}</h1>
            {/* ✅ Title character limit indicator */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${titleStatus}`}>
              {getCharacterLimitIcon(item.title?.length || 0, TITLE_MAX)}
              {item.title?.length || 0}/{TITLE_MAX}
            </span>
          </div>
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
          {item.status ? "✅ Active" : "⭕ Inactive"}
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
            {/* Excerpt with character limit indicator */}
            {item.excerpt && (
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-blue-800">Excerpt</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${excerptStatus}`}>
                    {getCharacterLimitIcon(item.excerpt?.length || 0, EXCERPT_MAX)}
                    {item.excerpt?.length || 0}/{EXCERPT_MAX}
                  </span>
                </div>
                <p className="italic text-blue-800">{item.excerpt}</p>
              </div>
            )}

            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: item.content }} />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Basic Details */}
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
              value={String(item.viewCount || 0)}
            />
          </div>

          {/* ✅ SEO Metadata Section */}
          {seo && (seo.metaTitle || seo.metaDescription || seo.metaKeywords || seo.canonicalUrl) && (
            <div className="bg-white border rounded-xl shadow-sm p-5 space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Search size={18} />
                SEO Metadata
              </h3>
              
              {/* Meta Title */}
              {seo.metaTitle && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-500">Meta Title</label>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${metaTitleStatus}`}>
                      {getCharacterLimitIcon(seo.metaTitle.length, META_TITLE_MAX)}
                      {seo.metaTitle.length}/{META_TITLE_MAX}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{seo.metaTitle}</p>
                  {seo.metaTitle.length > META_TITLE_MAX && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={12} /> Exceeds Google's recommended limit of {META_TITLE_MAX} characters
                    </p>
                  )}
                </div>
              )}
              
              {/* Meta Description */}
              {seo.metaDescription && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-500">Meta Description</label>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${metaDescStatus}`}>
                      {getCharacterLimitIcon(seo.metaDescription.length, META_DESC_MAX)}
                      {seo.metaDescription.length}/{META_DESC_MAX}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{seo.metaDescription}</p>
                  {seo.metaDescription.length > META_DESC_MAX && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={12} /> Exceeds Google's recommended limit of {META_DESC_MAX} characters
                    </p>
                  )}
                </div>
              )}
              
              {/* Meta Keywords */}
              {seo.metaKeywords && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Meta Keywords</label>
                  <div className="flex flex-wrap gap-1">
                    {seo.metaKeywords.split(',').map((keyword, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">
                        {keyword.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Canonical URL */}
              {seo.canonicalUrl && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <LinkIcon size={12} /> Canonical URL
                  </label>
                  <a href={seo.canonicalUrl} target="_blank" rel="noopener noreferrer" 
                     className="text-sm text-blue-600 hover:underline break-all">
                    {seo.canonicalUrl}
                  </a>
                </div>
              )}
              
              {/* Open Graph */}
              {(seo.ogTitle || seo.ogDescription || seo.ogImage) && (
                <div className="pt-3 border-t">
                  <label className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-2">
                    <Facebook size={12} /> Open Graph (Social Media)
                  </label>
                  {seo.ogTitle && (
                    <p className="text-sm text-gray-700 mb-1">
                      <span className="font-medium">OG Title:</span> {seo.ogTitle}
                    </p>
                  )}
                  {seo.ogDescription && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">OG Description:</span> {seo.ogDescription}
                    </p>
                  )}
                  {seo.ogImage && (
                    <div className="mt-2">
                      <img src={seo.ogImage} alt="OG Image" className="w-32 h-32 object-cover rounded border" />
                    </div>
                  )}
                </div>
              )}
              
              {/* Twitter Card */}
              {(seo.twitterTitle || seo.twitterDescription) && (
                <div className="pt-3 border-t">
                  <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <Twitter size={12} /> Twitter Card
                  </label>
                  <p className="text-sm text-gray-700 mt-1">
                    <span className="font-medium">Card Type:</span> {seo.twitterCard || "summary_large_image"}
                  </p>
                  {seo.twitterTitle && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Title:</span> {seo.twitterTitle}
                    </p>
                  )}
                  {seo.twitterDescription && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Description:</span> {seo.twitterDescription}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Related Entities */}
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
      <div className="text-xs text-gray-400 flex justify-between pt-4 border-t">
        <span>📅 Created: {formatDate(item.createdAt)}</span>
        <span>✏️ Updated: {formatDate(item.updatedAt)}</span>
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
      className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}