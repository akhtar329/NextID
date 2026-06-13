// app/(public)/admissions/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { 
  GraduationCap, 
  MapPin,
  Clock, 
  ChevronRight,
  Building2
} from "lucide-react";
import { postService } from "@/services/post/post.service";
import SidebarWidgets from "@/components/sections/Home/SidebarWidgets";
import { generateJsonLd } from "@/lib/seo";
import { cacheTag, cacheLife } from "next/cache";

// Helper functions
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined && value !== null ? value : defaultValue;
}

// Types
interface Program {
  name: string;
  slug?: string;
}

interface AdmissionItem {
  id: number;
  slug: string;
  title: string;
  featuredImage?: string | null;
  instituteName: string;
  cityName: string;
  status: string;
  closeDate: Date | null;
  programs: Program[];
  isFeatured: boolean;
}

function formatDate(date: Date | null): string {
  if (!date) return 'TBA';
  return date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
}

// ✅ CACHED DATA FETCHING FUNCTIONS WITH ERROR HANDLING
async function getAdmissionsData() {
  "use cache";
  cacheTag("admissions-data");
  cacheLife("hours");
  
  try {
    const posts = await postService.getPostsByType('admission', 50) as any;
    
    // Ensure posts is an array
    if (!posts || !Array.isArray(posts)) {
      console.warn('Posts data is not an array:', posts);
      return {
        admissions: [],
        featuredAdmissions: [],
        totalCount: 0,
        openCount: 0,
        closedCount: 0
      };
    }
    
    const admissions: AdmissionItem[] = posts.map(post => {
      const meta = post.meta || {};
      const closeDate = getMetaValue(meta, 'closeDate', null) ? new Date(getMetaValue(meta, 'closeDate', '')) : null;
      
      return {
        id: post.id,
        slug: post.slug,
        title: post.title || 'Untitled',
        featuredImage: post.featuredImage,
        instituteName: getMetaValue(meta, 'instituteName', 'University'),
        cityName: getMetaValue(meta, 'cityName', 'Pakistan'),
        status: getMetaValue(meta, 'status', 'Open'),
        closeDate: (closeDate && !isNaN(closeDate.getTime())) ? closeDate : null,
        programs: getMetaValue(meta, 'programs', []),
        isFeatured: post.isFeatured || getMetaValue(meta, 'isFeatured', false),
      };
    });

    const featuredAdmissions = admissions.filter(a => a.isFeatured).slice(0, 2);
    const totalCount = admissions.length;
    const openCount = admissions.filter(a => a.status === "Open").length;
    const closedCount = totalCount - openCount;

    return {
      admissions,
      featuredAdmissions,
      totalCount,
      openCount,
      closedCount
    };
  } catch (error) {
    console.error('Error fetching admissions data:', error);
    return {
      admissions: [],
      featuredAdmissions: [],
      totalCount: 0,
      openCount: 0,
      closedCount: 0
    };
  }
}

async function getOpenCountForMetadata() {
  "use cache";
  cacheTag("admissions-metadata");
  cacheLife("hours");
  
  try {
    const posts = await postService.getPostsByType('admission', 50) as any;
    if (!posts || !Array.isArray(posts)) return 0;
    return posts.filter(post => getMetaValue(post.meta, 'status', 'Open') === "Open").length;
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return 0;
  }
}

// ============ METADATA ============
export async function generateMetadata(): Promise<Metadata> {
  const openCount = await getOpenCountForMetadata();
  const currentYear = "2026";
  
  return {
    title: `Admissions ${currentYear} in Pakistan | NextID.pk`,
    description: `Find ${openCount}+ latest university admissions in Pakistan for ${currentYear}. Check deadlines, eligibility criteria, programs offered, and apply online.`,
    keywords: `admissions ${currentYear}, university admissions Pakistan, college admissions, admission schedule, education Pakistan`,
    alternates: {
      canonical: 'https://www.nextid.pk/admissions',
    },
    openGraph: {
      title: `Admissions ${currentYear} in Pakistan | NextID.pk`,
      description: `Find latest university admissions in Pakistan. Check deadlines and programs.`,
      url: 'https://www.nextid.pk/admissions',
      siteName: 'NextID.pk',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Admissions in Pakistan',
        },
      ],
      locale: 'en_PK',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Admissions ${currentYear} in Pakistan`,
      description: `Find latest university admissions in Pakistan. Check deadlines and programs.`,
      images: ['/og-image.png'],
      site: '@nextidpk',
      creator: '@nextidpk',
    },
  };
}

// ✅ MAIN PAGE COMPONENT
export default async function AdmissionsPage() {
  const currentYear = "2026";
  
  // Get initial data for JSON-LD
  const { admissions, totalCount, openCount } = await getAdmissionsData();

  // Generate JSON-LD Structured Data for SEO
  const jsonLd = generateJsonLd({
    type: 'WebPage',
    title: `Admissions ${currentYear} in Pakistan`,
    description: `Find ${openCount}+ university admissions in Pakistan.`,
    url: 'https://www.nextid.pk/admissions',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Admissions', url: '/admissions' },
    ],
  });

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": `Admissions ${currentYear} in Pakistan`,
            "description": `List of ${openCount} open admissions in Pakistan`,
            "numberOfItems": totalCount,
            "url": "https://www.nextid.pk/admissions",
            "itemListElement": admissions.slice(0, 10).map((item, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "url": `https://www.nextid.pk/admissions/${item.slug}`,
              "name": item.title
            }))
          })
        }}
      />
      
      <main className="min-h-screen bg-gray-50">
        
        {/* Hero Section */}
        <Suspense fallback={<HeroSkeleton />}>
          <HeroSection />
        </Suspense>

        {/* Main Content with Suspense Boundaries */}
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* MAIN CONTENT - Wrapped in Suspense */}
            <main className="lg:w-2/3">
              <Suspense fallback={<AdmissionsListSkeleton />}>
                <AdmissionsListContent />
              </Suspense>
            </main>
            
            {/* SIDEBAR - Wrapped in Suspense */}
            <aside className="lg:w-1/3">
              <div className="lg:sticky lg:top-6 space-y-6">
                <Suspense fallback={<SidebarSkeleton />}>
                  <SidebarWidgets />
                </Suspense>
              </div>
            </aside>
            
          </div>
        </div>
      </main>
    </>
  );
}

// ✅ HERO SECTION COMPONENT
async function HeroSection() {
  const { openCount, totalCount } = await getAdmissionsData();
  const currentYear = "2026";
  const closedCount = totalCount - openCount;
  
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
      <div className="container mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
          <GraduationCap className="w-4 h-4" />
          <span className="text-sm">Admissions {currentYear}</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-3">
          University Admissions
        </h1>
        <p className="text-lg text-blue-100 max-w-2xl mx-auto">
          {openCount} admissions currently open across Pakistan
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm">
          <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
            <span className="font-semibold">{totalCount}</span> Total Admissions
          </div>
          <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
            <span className="font-semibold">{openCount}</span> Open
          </div>
          <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
            <span className="font-semibold">{closedCount}</span> Closed
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroSkeleton() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
      <div className="container mx-auto px-4 text-center">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-white/20 rounded-full mx-auto mb-4"></div>
          <div className="h-12 w-96 bg-white/20 rounded-lg mx-auto mb-3"></div>
          <div className="h-6 w-64 bg-white/20 rounded-lg mx-auto"></div>
        </div>
      </div>
    </div>
  );
}

// ✅ ADMISSIONS LIST COMPONENT
async function AdmissionsListContent() {
  const { admissions, featuredAdmissions, totalCount } = await getAdmissionsData();
  
  // Handle empty state
  if (!admissions || admissions.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl">
        <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700">No admissions found</h3>
        <p className="text-gray-400 text-sm mt-1">Check back later for new admissions</p>
      </div>
    );
  }
  
  return (
    <>
      {/* Featured Admissions */}
      {featuredAdmissions && featuredAdmissions.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
            <span className="w-1 h-5 bg-amber-500 rounded-full"></span>
            Featured Admissions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {featuredAdmissions.map((item) => (
              <Link 
                key={item.id} 
                href={`/admissions/${item.slug}`}
                className="group"
              >
                <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-100 h-full">
                  <div className="relative h-36 w-full">
                    {item.featuredImage ? (
                      <Image
                        src={item.featuredImage}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
                        <GraduationCap className="w-12 h-12 text-blue-400" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                      Featured
                    </div>
                    {item.status === "Open" && (
                      <div className="absolute bottom-3 left-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        Open
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition line-clamp-2 text-base">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{item.instituteName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{item.cityName}</span>
                    </div>
                    {item.closeDate && (
                      <div className="flex items-center gap-1 text-xs text-orange-600 mt-2">
                        <Clock className="w-3 h-3" />
                        Deadline: {formatDate(item.closeDate)}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* All Admissions */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
          <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
          All Admissions
          <span className="text-sm font-normal text-gray-500 ml-2">({totalCount})</span>
        </h2>
        
        <div className="space-y-3">
          {admissions.map((item) => (
            <Link 
              key={item.id} 
              href={`/admissions/${item.slug}`}
              className="block bg-white rounded-lg border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group"
            >
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition line-clamp-1 text-sm md:text-base">
                        {item.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                        item.status === "Open" 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {item.instituteName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {item.cityName}
                      </span>
                      {item.closeDate && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-orange-600">
                            <Clock className="w-3 h-3" />
                            {formatDate(item.closeDate)}
                          </span>
                        </>
                      )}
                    </div>
                    
                    {item.programs && item.programs.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {item.programs.slice(0, 2).map((program, idx) => (
                          <span key={idx} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                            {program.name}
                          </span>
                        ))}
                        {item.programs.length > 2 && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">
                            +{item.programs.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

function AdmissionsListSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 bg-gray-200 rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-gray-200 rounded-xl h-64"></div>
        <div className="bg-gray-200 rounded-xl h-64"></div>
      </div>
      <div className="h-8 w-40 bg-gray-200 rounded mt-8"></div>
      <div className="space-y-3">
        <div className="bg-gray-200 rounded-lg h-24"></div>
        <div className="bg-gray-200 rounded-lg h-24"></div>
        <div className="bg-gray-200 rounded-lg h-24"></div>
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-2">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}