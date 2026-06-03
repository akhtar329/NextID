import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { 
  Calendar, MapPin, Clock,
  AlertCircle, CheckCircle, XCircle,
  ClipboardList
} from 'lucide-react';
import { postService } from '@/services/post/post.service';

// ============ TYPES ============
interface Program {
  id: number;
  name: string;
  slug: string;
  degreeName?: string;
  duration?: string;
  feeRange?: string;
  seats?: number;
  specificEligibility?: string;
}

interface FeeStructure {
  applicationFee?: number;
  tuitionFee?: number;
}

interface Admission {
  id: number;
  slug: string;
  title: string;
  content: string | null;
  excerpt: string | null;
  status: string;
  year: number;
  session: string | null;
  openDate: Date | null;
  closeDate: Date | null;
  instituteName: string;
  instituteSlug: string;
  cityName: string;
  citySlug: string;
  eligibility: string | null;
  howToApply: string | null;
  requiredDocuments: string[];
  feeStructure: FeeStructure | null;
  meritInfo: string | null;
  note: string | null;
  officialLink: string | null;
  applicationLink: string | null;
  featuredImage: string | null;
  programs: Program[];
}

interface StatusConfig {
  bg: string;
  text: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  border: string;
}

// ============ HELPER FUNCTIONS ============
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined && value !== null ? value : defaultValue;
}

function formatDate(date: Date | null): string {
  if (!date) return 'TBA';
  return date.toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getStatusConfig(status: string): StatusConfig {
  const configs: Record<string, StatusConfig> = {
    'Open': { 
      bg: 'bg-green-100', text: 'text-green-700', label: 'Applications Open', 
      icon: CheckCircle, border: 'border-green-200' 
    },
    'Closed': { 
      bg: 'bg-red-100', text: 'text-red-700', label: 'Applications Closed', 
      icon: XCircle, border: 'border-red-200' 
    },
    'Expected': { 
      bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Opening Soon', 
      icon: Clock, border: 'border-yellow-200' 
    },
  };
  return configs[status] || { 
    bg: 'bg-gray-100', text: 'text-gray-700', label: status, 
    icon: AlertCircle, border: 'border-gray-200' 
  };
}

// ============ DATA FETCHING ============
async function getAdmissionDetail(slug: string) {
  try {
    const post = await postService.getPost(slug);
    if (!post || post.type !== 'admission') return null;
    
    const meta = post.meta || {};
    const programsRaw = getMetaValue(meta, 'programs', []) as Array<Record<string, unknown>>;
    
    const programs: Program[] = programsRaw.map((p) => ({
      id: typeof p.id === 'number' ? p.id : Date.now(),
      name: typeof p.name === 'string' ? p.name : '',
      slug: typeof p.slug === 'string' ? p.slug : '',
      degreeName: typeof p.degreeName === 'string' ? p.degreeName : undefined,
      duration: typeof p.duration === 'string' ? p.duration : undefined,
      feeRange: typeof p.feeRange === 'string' ? p.feeRange : undefined,
      seats: typeof p.seats === 'number' ? p.seats : undefined,
      specificEligibility: typeof p.specificEligibility === 'string' ? p.specificEligibility : undefined,
    })).filter(p => p.name);
    
    const openDateRaw = getMetaValue(meta, 'openDate', null);
    const closeDateRaw = getMetaValue(meta, 'closeDate', null);
    
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      status: getMetaValue(meta, 'status', 'Open'),
      year: getMetaValue(meta, 'year', new Date().getFullYear()),
      session: getMetaValue(meta, 'session', null),
      openDate: openDateRaw ? new Date(openDateRaw as string) : null,
      closeDate: closeDateRaw ? new Date(closeDateRaw as string) : null,
      instituteName: getMetaValue(meta, 'instituteName', 'University'),
      instituteSlug: getMetaValue(meta, 'instituteSlug', 'university'),
      cityName: getMetaValue(meta, 'cityName', 'Pakistan'),
      citySlug: getMetaValue(meta, 'citySlug', 'pakistan'),
      eligibility: getMetaValue(meta, 'eligibility', null),
      howToApply: getMetaValue(meta, 'howToApply', null),
      requiredDocuments: getMetaValue(meta, 'requiredDocuments', []),
      feeStructure: getMetaValue(meta, 'feeStructure', null) as FeeStructure | null,
      meritInfo: getMetaValue(meta, 'meritInfo', null),
      note: getMetaValue(meta, 'note', null),
      officialLink: getMetaValue(meta, 'officialLink', null),
      applicationLink: getMetaValue(meta, 'applicationLink', null),
      featuredImage: post.featuredImage,
      programs,
    };
  } catch (error) {
    console.error('Error fetching admission detail:', error);
    return null;
  }
}

// ============ METADATA ============
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const admission = await getAdmissionDetail(slug);
  
  if (!admission) {
    return { title: 'Admission Not Found', robots: { index: false } };
  }
  
  return {
    title: `${admission.title} | ${admission.instituteName} Admissions ${admission.year} | NextID.pk`,
    description: `${admission.instituteName} admissions ${admission.year}. ${admission.programs.length} programs offered.`,
    alternates: { canonical: `https://www.nextid.pk/admissions/${admission.slug}` },
  };
}

// ============ CLIENT COMPONENT FOR DETAILS ============
function AdmissionDetails({ admissionPromise }: { admissionPromise: Promise<Admission | null> }) {
  // ✅ This component awaits the promise inside Suspense
  const admission = React.use(admissionPromise);
  
  if (!admission) return null;
  
  const statusConfig = getStatusConfig(admission.status);
  const StatusIcon = statusConfig.icon;
  const effectiveCloseDate = admission.closeDate;
  
  let daysRemaining: number | null = null;
  if (effectiveCloseDate) {
    const today = new Date();
    daysRemaining = Math.ceil((effectiveCloseDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
        <div className="container mx-auto px-4 py-12 lg:py-16 relative">
          <div className="text-sm text-indigo-200 mb-6 flex items-center gap-2 flex-wrap">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <Link href="/admissions" className="hover:text-white">Admissions</Link>
            <span>/</span>
            <span className="text-white">{admission.instituteName}</span>
          </div>
          
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-5 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border`}>
            <StatusIcon className="w-4 h-4" />
            <span>{statusConfig.label}</span>
            {daysRemaining && statusConfig.label === 'Applications Open' && daysRemaining > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                {daysRemaining} days left
              </span>
            )}
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">{admission.title}</h1>
          
          <div className="flex flex-wrap gap-4 text-indigo-200">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <Link href={`/cities/${admission.citySlug}`} className="hover:text-white">{admission.cityName}</Link>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>Session: {admission.session || `Fall ${admission.year}`}</span>
            </div>
            {effectiveCloseDate && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>Last Date: {formatDate(effectiveCloseDate)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600" />
                Admission Quick Info
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <p className="text-2xl font-bold text-blue-600">{admission.programs.length}</p>
                  <p className="text-xs text-gray-600">Programs</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <p className="text-2xl font-bold text-green-600">{admission.year}</p>
                  <p className="text-xs text-gray-600">Session Year</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-xl">
                  <p className="text-2xl font-bold text-purple-600">{admission.cityName}</p>
                  <p className="text-xs text-gray-600">Location</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-xl">
                  <p className="text-2xl font-bold text-orange-600">{statusConfig.label === 'Applications Open' ? 'Active' : 'Closed'}</p>
                  <p className="text-xs text-gray-600">Status</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ✅ Add React import for `use`
import React from 'react';

// ============ LOADING COMPONENT ============
function AdmissionLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading admission details...</p>
      </div>
    </div>
  );
}

// ============ MAIN PAGE ============
export default async function AdmissionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  // ✅ Get slug without awaiting
  const slugPromise = params.then(p => p.slug);
  
  // ✅ Create data promise
  const dataPromise = slugPromise.then(async (slug) => {
    const admission = await getAdmissionDetail(slug);
    if (!admission) notFound();
    return admission;
  });
  
  return (
    <Suspense fallback={<AdmissionLoading />}>
      <AdmissionDetails admissionPromise={dataPromise} />
    </Suspense>
  );
}