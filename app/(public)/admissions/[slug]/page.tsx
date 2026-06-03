// app/(public)/admissions/[slug]/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Calendar, MapPin, Building2, Clock } from 'lucide-react';
import { postService } from '@/services/post/post.service';

// Helper functions
function getMetaValue<T>(meta: Record<string, unknown> | null, key: string, defaultValue: T): T {
  if (!meta) return defaultValue;
  const value = meta[key] as T;
  return value !== undefined && value !== null ? value : defaultValue;
}

function formatDate(date: Date | null): string {
  if (!date) return 'TBA';
  return date.toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' });
}

export const metadata: Metadata = {
  title: 'Admission Details | NextID.pk',
  description: 'View complete admission details including eligibility, programs, and application process.',
};

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

// ============ CONTENT COMPONENT ============
async function AdmissionContent({ slugPromise }: { slugPromise: Promise<string> }) {
  const slug = await slugPromise;
  const post = await postService.getPost(slug);
  
  if (!post || post.type !== 'admission') {
    notFound();
  }
  
  const meta = post.meta || {};
  const openDate = getMetaValue(meta, 'openDate', null);
  const closeDate = getMetaValue(meta, 'closeDate', null);
  const instituteName = getMetaValue(meta, 'instituteName', 'University');
  const cityName = getMetaValue(meta, 'cityName', 'Pakistan');
  
  return (
    <>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumbs */}
            <div className="text-sm text-blue-200 mb-4">
              <Link href="/" className="hover:text-white">Home</Link>
              {' / '}
              <Link href="/admissions" className="hover:text-white">Admissions</Link>
              {' / '}
              <span className="text-white">{post.title}</span>
            </div>
            
            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
            
            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 text-blue-200">
              <div className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                <span>{instituteName}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{cityName}</span>
              </div>
              {openDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Starts: {formatDate(new Date(openDate as string))}</span>
                </div>
              )}
              {closeDate && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Deadline: {formatDate(new Date(closeDate as string))}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Featured Image */}
          {post.featuredImage && (
            <div className="relative w-full h-80">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
          
          {/* Content */}
          <div className="p-6 md:p-8">
            {post.excerpt && (
              <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                <p className="text-blue-800 italic">{post.excerpt}</p>
              </div>
            )}
            
            <div 
              className="prose prose-lg max-w-none
                prose-headings:text-gray-900 prose-headings:font-bold
                prose-p:text-gray-700 prose-p:leading-relaxed
                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-gray-900
                prose-li:text-gray-700
                prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: post.content || '' }}
            />
          </div>
          
          {/* Footer */}
          <div className="border-t border-gray-100 px-6 md:px-8 py-4 bg-gray-50">
            <p className="text-xs text-gray-400">
              Published: {formatDate(post.publishedAt || post.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ============ MAIN PAGE ============
export default async function AdmissionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const slugPromise = params.then(p => p.slug);
  
  return (
    <Suspense fallback={<AdmissionLoading />}>
      <AdmissionContent slugPromise={slugPromise} />
    </Suspense>
  );
}