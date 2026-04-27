// app/(public)/date-sheets/[slug]/page.tsx
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";

export const revalidate = 86400;
export const dynamic = 'force-static';
export const dynamicParams = true;

interface DateSheetPageProps {
  params: Promise<{ slug: string }>;
}

async function getDateSheet(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    const apiUrl = `${baseUrl}/api/public/date-sheets?slug=${encodeURIComponent(slug)}`;
    console.log('Fetching from:', apiUrl);
    
    const response = await fetch(apiUrl, {
      next: { revalidate: 86400 },
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      console.log(`API returned ${response.status} for slug: ${slug}`);
      return null;
    }
    
    const result = await response.json();
    console.log('API response:', result);
    
    return result.success ? result.data : null;
  } catch (error) {
    console.error('Error fetching date sheet:', error);
    return null;
  }
}

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

  const title = dateSheet.title;
  const examType = dateSheet.examType || "Annual";
  const year = dateSheet.year;

  return {
    title: `${title} - Download ${examType} Exams Schedule ${year} | NextID.pk`,
    description: `Download official ${title}. Complete ${examType} examinations date sheet for ${year}.`,
    alternates: {
      canonical: `https://www.nextid.pk/date-sheets/${slug}`,
    },
    openGraph: {
      title: title,
      description: `Download official ${title} for ${year}`,
      url: `https://www.nextid.pk/date-sheets/${slug}`,
      siteName: "NextID.pk",
      type: "article",
    },
  };
}

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            "name": boardOrInstitute || "Educational Board",
            "url": currentUrl,
            "description": dateSheet.description,
          }),
        }}
      />
      
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
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

        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 space-y-6">
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