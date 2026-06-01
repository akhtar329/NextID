// app/(public)/admissions/[slug]/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { 
  Calendar, 
  MapPin, 
  Building2, 
  Clock, 
  ExternalLink, 
  GraduationCap,
  AlertCircle,
  CheckCircle,
  XCircle,
  DollarSign,
  FileText,
  Award,
  TrendingUp,
  Shield,
  LucideIcon,
  Share2,
  Bell,
  MessageCircle,
  Download,
  Users,
  ClipboardList,
  CreditCard,
  UserCheck,
  FileCheck
} from 'lucide-react';

import { postService } from '@/services/post/post.service';

export const revalidate = 3600;

// Types
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
  [key: string]: number | undefined;
}

interface AdmissionDetail {
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
  viewCount: number;
}

// Helper functions
function formatDate(date: Date | null): string {
  if (!date) return 'TBA';
  return new Date(date).toLocaleDateString('en-PK', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

function getDaysRemaining(date: Date | null): number | null {
  if (!date) return null;
  const today = new Date();
  const target = new Date(date);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : null;
}

function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined ? value : defaultValue;
}

function getStatusConfig(status: string): {
  bg: string;
  text: string;
  label: string;
  icon: LucideIcon;
  border: string;
} {
  const configs: Record<string, {
    bg: string;
    text: string;
    label: string;
    icon: LucideIcon;
    border: string;
  }> = {
    'Open': { 
      bg: 'bg-green-100', 
      text: 'text-green-700', 
      label: 'Applications Open', 
      icon: CheckCircle,
      border: 'border-green-200'
    },
    'Closed': { 
      bg: 'bg-red-100', 
      text: 'text-red-700', 
      label: 'Applications Closed', 
      icon: XCircle,
      border: 'border-red-200'
    },
    'Expected': { 
      bg: 'bg-yellow-100', 
      text: 'text-yellow-700', 
      label: 'Opening Soon', 
      icon: Clock,
      border: 'border-yellow-200'
    },
  };
  return configs[status] || { 
    bg: 'bg-gray-100', 
    text: 'text-gray-700', 
    label: status, 
    icon: AlertCircle,
    border: 'border-gray-200'
  };
}

// Get admission detail from posts service
async function getAdmissionDetail(slug: string): Promise<AdmissionDetail | null> {
  try {
    const post = await postService.getPost(slug);
    
    if (!post || post.type !== 'admission') {
      return null;
    }
    
    const meta = post.meta;
    const programsRaw = getMetaValue(meta, 'programs', []) as Array<Record<string, unknown>>;
    
    const programs: Program[] = programsRaw.map((p: Record<string, unknown>) => ({
      id: p.id as number,
      name: p.name as string,
      slug: p.slug as string,
      degreeName: p.degreeName as string | undefined,
      duration: p.duration as string | undefined,
      feeRange: p.feeRange as string | undefined,
      seats: p.seats as number | undefined,
      specificEligibility: p.specificEligibility as string | undefined,
    }));
    
    const feeStructureRaw = getMetaValue(meta, 'feeStructure', null) as FeeStructure | null;
    
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      status: getMetaValue(meta, 'status', 'Open'),
      year: getMetaValue(meta, 'year', new Date().getFullYear()),
      session: getMetaValue(meta, 'session', null),
      openDate: getMetaValue(meta, 'openDate', null) ? new Date(getMetaValue(meta, 'openDate', '')) : null,
      closeDate: getMetaValue(meta, 'closeDate', null) ? new Date(getMetaValue(meta, 'closeDate', '')) : null,
      instituteName: getMetaValue(meta, 'instituteName', 'University'),
      instituteSlug: getMetaValue(meta, 'instituteSlug', 'university'),
      cityName: getMetaValue(meta, 'cityName', 'Pakistan'),
      citySlug: getMetaValue(meta, 'citySlug', 'pakistan'),
      eligibility: getMetaValue(meta, 'eligibility', null),
      howToApply: getMetaValue(meta, 'howToApply', null),
      requiredDocuments: getMetaValue(meta, 'requiredDocuments', []),
      feeStructure: feeStructureRaw,
      meritInfo: getMetaValue(meta, 'meritInfo', null),
      note: getMetaValue(meta, 'note', null),
      officialLink: getMetaValue(meta, 'officialLink', null),
      applicationLink: getMetaValue(meta, 'applicationLink', null),
      featuredImage: post.featuredImage,
      programs,
      viewCount: post.viewCount || 0,
    };
  } catch (error) {
    console.error('Error fetching admission detail:', error);
    return null;
  }
}

// Get related admissions
async function getRelatedAdmissions(currentSlug: string): Promise<Array<{
  id: number;
  slug: string;
  name: string;
  instituteName: string;
  year: number;
  session: string;
}>> {
  try {
    const allAdmissions = await postService.getPostsByType('admission', 10);
    return allAdmissions
      .filter(p => p.slug !== currentSlug)
      .slice(0, 3)
      .map(post => ({
        id: post.id,
        slug: post.slug,
        name: post.title,
        instituteName: getMetaValue(post.meta, 'instituteName', 'University'),
        year: getMetaValue(post.meta, 'year', new Date().getFullYear()),
        session: getMetaValue(post.meta, 'session', 'Fall'),
      }));
  } catch {
    return [];
  }
}

// Render HTML content safely
function RenderHtml({ content }: { content: string | null }) {
  if (!content) return null;
  return (
    <div 
      className="prose prose-sm max-w-none text-gray-600"
      dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }}
    />
  );
}

// Metadata generation
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const admission = await getAdmissionDetail(slug);
  
  if (!admission) {
    return { title: 'Admission Not Found', robots: { index: false } };
  }

  return {
    title: `${admission.title || `${admission.instituteName} Admissions ${admission.year}`} | NextID.pk`,
    description: `${admission.instituteName} admissions ${admission.year}. ${admission.programs.length} programs offered. Last date: ${formatDate(admission.closeDate)}`,
    alternates: { canonical: `https://www.nextid.pk/admissions/${admission.slug}` },
    openGraph: {
      title: `${admission.instituteName} Admissions ${admission.year}`,
      description: `Apply for programs at ${admission.instituteName}. Last date: ${formatDate(admission.closeDate)}`,
      url: `https://www.nextid.pk/admissions/${admission.slug}`,
      type: 'article',
    },
  };
}

// Main Page Component
export default async function AdmissionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admission = await getAdmissionDetail(slug);
  
  if (!admission) {
    notFound();
  }

  const statusConfig = getStatusConfig(admission.status);
  const StatusIcon = statusConfig.icon;
  const daysRemaining = getDaysRemaining(admission.closeDate);
  const effectiveCloseDate = admission.closeDate;
  const relatedAdmissions = await getRelatedAdmissions(slug);

  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="container mx-auto px-4 py-12 lg:py-16 relative">
          {/* Breadcrumbs */}
          <div className="text-sm text-indigo-200 mb-6 flex items-center gap-2 flex-wrap">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <span>/</span>
            <Link href="/admissions" className="hover:text-white transition">Admissions</Link>
            <span>/</span>
            <span className="text-white">{admission.instituteName}</span>
          </div>
          
          {/* Status Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-5 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border`}>
            <StatusIcon className="w-4 h-4" />
            <span>{statusConfig.label}</span>
            {daysRemaining && statusConfig.label === 'Applications Open' && (
              <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                {daysRemaining} days left
              </span>
            )}
          </div>
          
          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            {admission.title}
          </h1>
          
          {/* Meta Info */}
          <div className="flex flex-wrap gap-4 text-indigo-200">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <Link href={`/cities/${admission.citySlug}`} className="hover:text-white transition">
                {admission.cityName}
              </Link>
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

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white hover:bg-white/20 transition">
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white hover:bg-white/20 transition">
              <Bell className="w-4 h-4" />
              Get Alerts
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white hover:bg-white/20 transition">
              <Download className="w-4 h-4" />
              Save PDF
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column - Main Content */}
          <div className="flex-1 space-y-6">
            
            {/* Deadline Alert Banner */}
            {effectiveCloseDate && daysRemaining && daysRemaining <= 14 && (
              <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-4 text-white shadow-lg">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-8 h-8 animate-pulse" />
                    <div>
                      <p className="font-bold text-lg">Application Deadline Approaching!</p>
                      <p className="text-sm opacity-90">Submit your application before {formatDate(effectiveCloseDate)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Info Cards */}
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
            
            {/* Institute Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
              <div className="flex flex-col sm:flex-row gap-5">
                {admission.featuredImage && (
                  <div className="shrink-0">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 p-2 border border-gray-100">
                      <Image
                        src={admission.featuredImage}
                        alt={admission.instituteName}
                        width={80}
                        height={80}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                    {admission.instituteName}
                  </h2>
                  {admission.content && (
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                      {admission.content}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Eligibility Criteria Section */}
            {admission.eligibility && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-green-600" />
                  Eligibility Criteria
                </h2>
                <RenderHtml content={admission.eligibility} />
              </div>
            )}

            {/* How to Apply Section */}
            {admission.howToApply && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-blue-600" />
                  How to Apply
                </h2>
                <RenderHtml content={admission.howToApply} />
                
                {/* Application Links */}
                {(admission.applicationLink || admission.officialLink) && (
                  <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-100">
                    {admission.applicationLink && (
                      <a href={admission.applicationLink} target="_blank" rel="noopener noreferrer"
                         className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition shadow-sm">
                        Apply Online
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    {admission.officialLink && (
                      <a href={admission.officialLink} target="_blank" rel="noopener noreferrer"
                         className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition">
                        Official Website
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Required Documents Section */}
            {admission.requiredDocuments.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-600" />
                  Required Documents
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {admission.requiredDocuments.map((doc: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-700">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fee Structure Section */}
            {admission.feeStructure && (admission.feeStructure.applicationFee || admission.feeStructure.tuitionFee) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  Fee Structure
                </h2>
                <div className="space-y-3">
                  {admission.feeStructure.applicationFee && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-700">Application Fee</span>
                      <span className="font-semibold text-gray-900">PKR {admission.feeStructure.applicationFee.toLocaleString()}</span>
                    </div>
                  )}
                  {admission.feeStructure.tuitionFee && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-700">Tuition Fee (per year)</span>
                      <span className="font-semibold text-gray-900">PKR {admission.feeStructure.tuitionFee.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Programs Section */}
            {admission.programs.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  Available Programs
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({admission.programs.length} {admission.programs.length === 1 ? 'Program' : 'Programs'})
                  </span>
                </h2>
                
                <div className="space-y-4">
                  {admission.programs.map((program, index) => (
                    <div key={program.id || index} className="border border-gray-100 rounded-xl p-4 hover:border-indigo-200 transition">
                      <div className="flex justify-between items-start flex-wrap gap-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {program.name}
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                            {program.duration && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span>Duration: {program.duration}</span>
                              </div>
                            )}
                            {program.feeRange && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <DollarSign className="w-4 h-4" />
                                <span>Fee: {program.feeRange}</span>
                              </div>
                            )}
                            {program.seats && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Users className="w-4 h-4" />
                                <span>Seats: {program.seats}</span>
                              </div>
                            )}
                          </div>
                          {program.specificEligibility && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                Eligibility:
                              </p>
                              <p className="text-sm text-gray-600 mt-1">{program.specificEligibility}</p>
                            </div>
                          )}
                        </div>
                        {admission.applicationLink && statusConfig.label === 'Applications Open' && (
                          <a href={admission.applicationLink} target="_blank" rel="noopener noreferrer"
                             className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">
                            Apply Now
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Merit Information */}
            {admission.meritInfo && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-600" />
                  Merit Information
                </h2>
                <p className="text-gray-600 text-sm whitespace-pre-line">{admission.meritInfo}</p>
              </div>
            )}

            {/* Additional Notes */}
            {admission.note && (
              <div className="bg-yellow-50 rounded-2xl border border-yellow-200 p-6">
                <h2 className="text-xl font-bold text-yellow-800 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Additional Notes
                </h2>
                <RenderHtml content={admission.note} />
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <aside className="lg:w-80 space-y-6">
            
            {/* Sticky Apply Button */}
            {admission.applicationLink && statusConfig.label === 'Applications Open' && (
              <div className="sticky top-24 bg-white rounded-2xl shadow-lg p-5 border border-indigo-200">
                <h3 className="font-bold text-gray-900 mb-3">Ready to Apply?</h3>
                <a href={admission.applicationLink} target="_blank" rel="noopener noreferrer"
                   className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-md">
                  Apply Online Now
                  <ExternalLink className="w-4 h-4" />
                </a>
                <p className="text-xs text-gray-500 text-center mt-3">Application deadline: {formatDate(effectiveCloseDate)}</p>
              </div>
            )}
            
            {/* Important Dates Card */}
            {(admission.openDate || effectiveCloseDate) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  Important Dates
                </h3>
                <div className="space-y-3">
                  {admission.openDate && (
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                      <span className="text-sm text-gray-600">Application Starts</span>
                      <span className="font-semibold text-green-700">{formatDate(admission.openDate)}</span>
                    </div>
                  )}
                  {effectiveCloseDate && (
                    <div className={`flex justify-between items-center p-3 rounded-xl ${daysRemaining && daysRemaining <= 7 ? 'bg-red-50' : 'bg-gray-50'}`}>
                      <span className="text-sm text-gray-600">Application Deadline</span>
                      <span className={`font-semibold ${daysRemaining && daysRemaining <= 7 ? 'text-red-700' : 'text-gray-700'}`}>
                        {formatDate(effectiveCloseDate)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Download Resources */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Download className="w-5 h-5 text-indigo-600" />
                Download Resources
              </h3>
              <div className="space-y-2">
                {admission.officialLink && (
                  <a href={admission.officialLink} target="_blank" rel="noopener noreferrer" 
                     className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-indigo-50 transition text-sm">
                    <span>📘 Official Admission Notification</span>
                    <ExternalLink className="w-4 h-4 text-indigo-600" />
                  </a>
                )}
              </div>
            </div>

            {/* WhatsApp Updates */}
            <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl p-5 text-white">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Get Updates on WhatsApp
              </h3>
              <p className="text-sm opacity-90 mb-3">Get admission reminders, deadline alerts, and merit list updates directly on WhatsApp.</p>
              <a href="https://wa.me/923XXXXXXXXX?text=I%20want%20to%20get%20updates%20for%20admissions" 
                 target="_blank"
                 className="block w-full text-center px-4 py-2 bg-white text-green-700 rounded-lg text-sm font-semibold hover:bg-gray-100 transition">
                Join WhatsApp Channel
              </a>
            </div>

            {/* Related Admissions */}
            {relatedAdmissions.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  Related Admissions
                </h3>
                <div className="space-y-3">
                  {relatedAdmissions.map((rel) => (
                    <Link 
                      key={rel.id} 
                      href={`/admissions/${rel.slug}`} 
                      className="block p-3 bg-gray-50 rounded-xl hover:bg-indigo-50 transition group"
                    >
                      <p className="font-medium text-gray-800 text-sm group-hover:text-indigo-600 transition">
                        {rel.name || rel.instituteName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{rel.year} • {rel.session || 'Fall'}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Need Help Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                Need Help?
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Have questions about this admission? Our team is here to help you.
              </p>
              <Link 
                href="/contact" 
                className="block w-full text-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
              >
                Contact Us
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* Floating WhatsApp Button */}
      <a href="https://wa.me/923XXXXXXXXX?text=I%20need%20help%20with%20admissions" 
         target="_blank"
         className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition animate-bounce">
        <MessageCircle className="w-6 h-6" />
      </a>

      {/* Floating Apply Button for Mobile */}
      {admission.applicationLink && statusConfig.label === 'Applications Open' && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 p-3 lg:hidden">
          <a href={admission.applicationLink} target="_blank" rel="noopener noreferrer"
             className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">
            Apply Now
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            "name": admission.instituteName,
            "url": `https://www.nextid.pk/admissions/${admission.slug}`,
            "description": admission.title,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": admission.cityName,
              "addressCountry": "PK"
            },
            "potentialAction": admission.applicationLink ? {
              "@type": "ApplyAction",
              "name": "Apply Now",
              "target": admission.applicationLink
            } : undefined
          })
        }}
      />
    </main>
  );
}