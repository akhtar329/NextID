// app/(public)/date-sheets/[slug]/page.tsx
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { db } from "@/app/lib/db";
import { dateSheets, boards, institutes, cities, seoMetadata } from "@/app/lib/schema";
import { eq, and } from "drizzle-orm"; // ✅ Make sure 'and' is imported

interface DateSheetPageProps {
  params: Promise<{ slug: string }>;
}

// Get SEO metadata from database
async function getSeoMetadata(entityId: number) {
  try {
    const [seo] = await db
      .select()
      .from(seoMetadata)
      .where(
        and(
          eq(seoMetadata.entityId, entityId),
          eq(seoMetadata.entityType, "date_sheet")
        )
      )
      .limit(1);
    return seo;
  } catch (error) {
    console.error("Error fetching SEO metadata:", error);
    return null;
  }
}

// Get date sheet with all details
async function getDateSheet(slug: string) {
  try {
    const [sheet] = await db
      .select({
        id: dateSheets.id,
        title: dateSheets.title,
        slug: dateSheets.slug,
        examType: dateSheets.examType,
        examDate: dateSheets.examDate,
        year: dateSheets.year,
        boardId: dateSheets.boardId,
        instituteId: dateSheets.instituteId,
        viewCount: dateSheets.viewCount,
        isPopular: dateSheets.isPopular,
        officialLink: dateSheets.officialLink,
        downloadLink: dateSheets.downloadLink,
        pdfFile: dateSheets.pdfFile,
        featuredImage: dateSheets.featuredImage,
        description: dateSheets.description,
        createdAt: dateSheets.createdAt,
        board: {
          name: boards.name,
          slug: boards.slug,
        },
        institute: {
          name: institutes.name,
          slug: institutes.slug,
          logo: institutes.logo,
          type: institutes.type,
          cityId: institutes.cityId,
        },
      })
      .from(dateSheets)
      .leftJoin(boards, eq(dateSheets.boardId, boards.id))
      .leftJoin(institutes, eq(dateSheets.instituteId, institutes.id))
      .where(eq(dateSheets.slug, slug))
      .limit(1);

    if (!sheet) return null;

    // Get city info
    let city = null;
    if (sheet.institute?.cityId) {
      const [cityData] = await db
        .select({
          name: cities.name,
          slug: cities.slug,
          province: cities.province,
        })
        .from(cities)
        .where(eq(cities.id, sheet.institute.cityId))
        .limit(1);
      city = cityData;
    }

    // Get SEO metadata
    const seo = await getSeoMetadata(sheet.id);

    // Increment view count
    await db
      .update(dateSheets)
      .set({ viewCount: (sheet.viewCount || 0) + 1 })
      .where(eq(dateSheets.id, sheet.id));

    return { ...sheet, city, seo, viewCount: (sheet.viewCount || 0) + 1 };
  } catch (error) {
    console.error("Error fetching date sheet:", error);
    return null;
  }
}

// Generate Metadata for SEO
export async function generateMetadata({ params }: DateSheetPageProps): Promise<Metadata> {
  const { slug } = await params;
  const dateSheet = await getDateSheet(slug);

  if (!dateSheet) {
    return {
      title: "Date Sheet Not Found | NextID.pk",
      description: "The requested date sheet could not be found.",
      robots: "noindex, nofollow",
    };
  }

  const boardOrInstitute = dateSheet.board?.name || dateSheet.institute?.name || "Pakistan";
  const examType = dateSheet.examType || "Annual";
  const year = dateSheet.year;
  const title = dateSheet.title;

  const metaTitle = dateSheet.seo?.metaTitle || `${title} - Download ${examType} Exams Schedule ${year} | NextID.pk`;
  const metaDescription = dateSheet.seo?.metaDescription || `Download official ${title}. Complete ${examType} examinations date sheet for ${year}.`;
  const canonicalUrl = dateSheet.seo?.canonicalUrl || `https://www.nextid.pk/date-sheets/${slug}`;
  const ogImage = dateSheet.seo?.ogImage || dateSheet.featuredImage || "https://www.nextid.pk/images/og-date-sheet.jpg";

  // ✅ Fix: Properly type twitter card
  const twitterCardType = dateSheet.seo?.twitterCard === "summary" ? "summary" : "summary_large_image";

  return {
    title: metaTitle,
    description: metaDescription,
    robots: dateSheet.seo?.robots || "index, follow",
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: dateSheet.seo?.ogTitle || metaTitle,
      description: dateSheet.seo?.ogDescription || metaDescription,
      url: canonicalUrl,
      siteName: "NextID.pk",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      locale: "en_PK",
      type: "article",
    },
    twitter: {
      card: twitterCardType,
      title: dateSheet.seo?.twitterTitle || metaTitle,
      description: dateSheet.seo?.twitterDescription || metaDescription,
      images: [ogImage],
    },
  };
}

// Main Page Component
export default async function DateSheetDetailPage({ params }: DateSheetPageProps) {
  const { slug } = await params;
  const dateSheet = await getDateSheet(slug);

  if (!dateSheet) {
    notFound();
  }

  const examDate = dateSheet.examDate ? new Date(dateSheet.examDate) : null;
  const boardOrInstitute = dateSheet.board?.name || dateSheet.institute?.name;
  const currentUrl = `https://www.nextid.pk/date-sheets/${slug}`;

  return (
    <>
      {/* JSON-LD Schema Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            "name": boardOrInstitute || "Educational Board",
            "url": currentUrl,
            "description": dateSheet.seo?.metaDescription || dateSheet.description,
          }),
        }}
      />
      
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-green-700 via-green-600 to-teal-800">
          <div className="container mx-auto px-4 py-12 relative z-10">
            <div className="max-w-4xl mx-auto">
              <nav className="flex items-center gap-2 text-sm text-green-100 mb-6">
                <Link href="/" className="hover:text-white transition">Home</Link>
                <span>›</span>
                <Link href="/date-sheets" className="hover:text-white transition">Date Sheets</Link>
                <span>›</span>
                <span className="text-white font-medium truncate">{dateSheet.title}</span>
              </nav>

              {dateSheet.isPopular && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 backdrop-blur-sm rounded-full mb-4">
                  <span className="text-yellow-300">⭐</span>
                  <span className="text-sm font-medium text-white">Popular Date Sheet</span>
                </div>
              )}

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                {dateSheet.title}
              </h1>
              
              <p className="text-lg text-green-100 mb-6">
                Download official {dateSheet.examType || "Annual"} examinations date sheet for {dateSheet.year}.
                {boardOrInstitute && ` Published by ${boardOrInstitute}.`}
              </p>

              <div className="flex flex-wrap gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <span className="text-green-200 text-sm">📅 Year</span>
                  <div className="text-white font-semibold">{dateSheet.year}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <span className="text-green-200 text-sm">📝 Exam Type</span>
                  <div className="text-white font-semibold">{dateSheet.examType || "Annual"}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <span className="text-green-200 text-sm">👁️ Views</span>
                  <div className="text-white font-semibold">{dateSheet.viewCount?.toLocaleString() || 0}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 space-y-6">
              {/* Download Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-teal-500 px-6 py-4">
                  <h2 className="text-white font-semibold text-lg">📄 Download Date Sheet</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dateSheet.officialLink && (
                      <a
                        href={dateSheet.officialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
                      >
                        🌐 Official Website
                      </a>
                    )}
                    {dateSheet.downloadLink && (
                      <a
                        href={dateSheet.downloadLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium"
                      >
                        📥 Download PDF
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {dateSheet.description && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">📖 About This Date Sheet</h2>
                  </div>
                  <div className="p-6 prose prose-green max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: dateSheet.description }} />
                  </div>
                </div>
              )}

              {/* Exam Schedule */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-800">📅 Exam Schedule</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="text-gray-500 text-sm">📝 Exam Type</div>
                      <div className="font-semibold text-gray-900 text-lg mt-1">
                        {dateSheet.examType || "Annual Examinations"}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="text-gray-500 text-sm">📅 Year</div>
                      <div className="font-semibold text-gray-900 text-lg mt-1">{dateSheet.year}</div>
                    </div>
                    {examDate && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="text-gray-500 text-sm">📆 Exam Date</div>
                        <div className="font-semibold text-gray-900 text-lg mt-1">
                          {examDate.toLocaleDateString('en-PK')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {(dateSheet.board || dateSheet.institute) && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
                  <div className="bg-gradient-to-r from-green-500 to-teal-500 px-6 py-4">
                    <h3 className="text-white font-semibold">
                      🏛️ {dateSheet.board ? "Board" : "Institute"} Information
                    </h3>
                  </div>
                  <div className="p-6 text-center">
                    <div className="text-5xl mb-3">{dateSheet.board ? "🏛️" : "🎓"}</div>
                    <h4 className="font-bold text-gray-900 text-lg">
                      {dateSheet.board?.name || dateSheet.institute?.name}
                    </h4>
                    {dateSheet.city && (
                      <p className="text-sm text-gray-500 mt-2">
                        📍 {dateSheet.city.name}, {dateSheet.city.province}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Share Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>📢</span> Share This Date Sheet
                </h3>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium share-button"
                    data-title={dateSheet.title}
                    data-url={currentUrl}
                  >
                    📋 Share Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Share Script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', function() {
              var shareButtons = document.querySelectorAll('.share-button');
              shareButtons.forEach(function(button) {
                button.addEventListener('click', function() {
                  var title = this.getAttribute('data-title');
                  var url = this.getAttribute('data-url');
                  if (navigator.share) {
                    navigator.share({
                      title: title,
                      text: 'Download ' + title,
                      url: url,
                    }).catch(function(e) {});
                  } else {
                    navigator.clipboard.writeText(url).then(function() {
                      alert('Link copied to clipboard!');
                    }).catch(function() {});
                  }
                });
              });
            });
          `,
        }}
      />
    </>
  );
}