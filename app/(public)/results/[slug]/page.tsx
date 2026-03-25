// app/(public)/results/[slug]/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/app/lib/db';
import { results, programs, institutes, cities, boards } from '@/app/lib/schema';
import { eq, and, ne, desc } from 'drizzle-orm';
import ResultClient from './ResultClient';

// ==================== TYPES ====================
interface ProgramType {
  id: number;
  name: string | null;
  slug: string | null;
  degreeId: number | null;
  overview: string | null;
  eligibility: string | null;
  duration: string | null;
  careerScope: string | null;
  feeRange: string | null;
}

interface CityType {
  id: number;
  name: string | null;
  slug: string | null;
  province: string | null;
}

interface InstituteType {
  id: number;
  name: string | null;
  slug: string | null;
  type: string | null;
  cityId: number | null;
  description: string | null;
  website: string | null;
  city: CityType | null;
}

interface BoardType {
  id: number;
  name: string | null;
  slug: string | null;
  cityId: number | null;
  website: string | null;
  description: string | null;
  city: CityType | null;
}

interface ResultType {
  id: number;
  slug: string | null;
  title: string | null;
  programId: number | null;
  instituteId: number | null;
  boardId: number | null;
  universityId: number | null;
  year: number | null;
  resultDate: Date | null;
  officialLink: string | null;
  isPopular: boolean | null;
  status: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  program: ProgramType | null;
  institute: InstituteType | null;
  board: BoardType | null;
}

// ==================== HELPER FUNCTIONS (Server Side Only) ====================
function formatDate(date: Date | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(date: Date | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PK', {
    month: 'long',
    year: 'numeric',
  });
}

function getDaysRemaining(date: Date | null): number | null {
  if (!date) return null;
  const today = new Date();
  const target = new Date(date);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// ==================== GET RESULT BY SLUG ====================
async function getResultBySlug(slug: string): Promise<ResultType | null> {
  try {
    
    const [result] = await db
      .select({
        id: results.id,
        slug: results.slug,
        title: results.title,
        programId: results.programId,
        instituteId: results.instituteId,
        boardId: results.boardId,
        universityId: results.universityId,
        year: results.year,
        resultDate: results.resultDate,
        officialLink: results.officialLink,
        isPopular: results.isPopular,
        status: results.status,
        createdAt: results.createdAt,
        updatedAt: results.updatedAt,
      })
      .from(results)
      .where(eq(results.slug, slug))
      .limit(1);

    if (!result) {
      return null;
    }

    // Get program details
    let program: ProgramType | null = null;
    if (result.programId) {
      const [prog] = await db
        .select({
          id: programs.id,
          name: programs.name,
          slug: programs.slug,
          degreeId: programs.degreeId,
          overview: programs.overview,
          eligibility: programs.eligibility,
          duration: programs.duration,
          careerScope: programs.careerScope,
          feeRange: programs.feeRange,
        })
        .from(programs)
        .where(eq(programs.id, result.programId))
        .limit(1);
      program = prog || null;
    }

    // Get institute/university details
    let institute: InstituteType | null = null;
    const instituteId = result.instituteId || result.universityId;
    
    if (instituteId) {
      const [inst] = await db
        .select({
          id: institutes.id,
          name: institutes.name,
          slug: institutes.slug,
          type: institutes.type,
          cityId: institutes.cityId,
          description: institutes.description,
          website: institutes.website,
        })
        .from(institutes)
        .where(eq(institutes.id, instituteId))
        .limit(1);

      if (inst) {
        let city: CityType | null = null;
        if (inst.cityId) {
          const [c] = await db
            .select({
              id: cities.id,
              name: cities.name,
              slug: cities.slug,
              province: cities.province,
            })
            .from(cities)
            .where(eq(cities.id, inst.cityId))
            .limit(1);
          city = c || null;
        }
        institute = { ...inst, city };
      }
    }

    // Get board details
    let board: BoardType | null = null;
    if (result.boardId) {
      const [b] = await db
        .select({
          id: boards.id,
          name: boards.name,
          slug: boards.slug,
          cityId: boards.cityId,
          website: boards.website,
          description: boards.description,
        })
        .from(boards)
        .where(eq(boards.id, result.boardId))
        .limit(1);

      if (b) {
        let city: CityType | null = null;
        if (b.cityId) {
          const [c] = await db
            .select({
              id: cities.id,
              name: cities.name,
              slug: cities.slug,
              province: cities.province,
            })
            .from(cities)
            .where(eq(cities.id, b.cityId))
            .limit(1);
          city = c || null;
        }
        board = { ...b, city };
      }
    }

    return { ...result, program, institute, board };
  } catch (error) {
    console.error('❌ Error fetching result:', error);
    return null;
  }
}

// ==================== GET RELATED RESULTS ====================
async function getRelatedResults(result: ResultType) {
  if (!result.slug) return [];
  
  try {
    const conditions = [];
    
    if (result.instituteId) {
      conditions.push(eq(results.instituteId, result.instituteId));
    } else if (result.universityId) {
      conditions.push(eq(results.universityId, result.universityId));
    } else if (result.boardId) {
      conditions.push(eq(results.boardId, result.boardId));
    }
    
    if (result.year) {
      conditions.push(eq(results.year, result.year));
    }
    
    conditions.push(eq(results.status, true));
    conditions.push(ne(results.slug, result.slug || ''));

    return await db
      .select({
        id: results.id,
        slug: results.slug,
        title: results.title,
        year: results.year,
        resultDate: results.resultDate,
        instituteName: institutes.name,
        boardName: boards.name,
      })
      .from(results)
      .leftJoin(institutes, eq(results.instituteId, institutes.id))
      .leftJoin(boards, eq(results.boardId, boards.id))
      .where(and(...conditions))
      .orderBy(desc(results.resultDate))
      .limit(5);
  } catch (error) {
    console.error('Error fetching related results:', error);
    return [];
  }
}

// ==================== GET RESULTS IN SAME CITY ====================
async function getCityResults(result: ResultType) {
  try {
    const cityId = result.institute?.city?.id || result.board?.city?.id;
    if (!cityId) return [];
    
    const cityResultsList = await db
      .select({
        id: results.id,
        slug: results.slug,
        title: results.title,
        year: results.year,
        resultDate: results.resultDate,
        instituteName: institutes.name,
        boardName: boards.name,
      })
      .from(results)
      .leftJoin(institutes, eq(results.instituteId, institutes.id))
      .leftJoin(boards, eq(results.boardId, boards.id))
      .where(
        and(
          eq(results.status, true),
          ne(results.slug, result.slug || '')
        )
      )
      .orderBy(desc(results.resultDate))
      .limit(5);
    
    return cityResultsList;
  } catch (error) {
    console.error('Error fetching city results:', error);
    return [];
  }
}

// ==================== STATUS BADGE ====================
function getStatusBadge(status: boolean | null) {
  if (status === true) return { bg: 'bg-green-100', text: 'text-green-700', label: 'Result Published', icon: '✅' };
  if (status === false) return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '⏳ Result Pending', icon: '⏳' };
  return { bg: 'bg-gray-100', text: 'text-gray-700', label: '❓ Unknown', icon: '❓' };
}

// ==================== SEO FUNCTIONS ====================
function generateMetaTitle(result: ResultType): string {
  const programName = result.program?.name || 'Exam';
  const institutionName = result.institute?.name || result.board?.name || 'Board';
  const year = result.year || '2026';
  
  let title = `${programName} Result ${year} - ${institutionName}`;
  
  if (title.length <= 55) {
    title = `${title} | NextID.pk`;
  }
  
  if (title.length > 60) {
    title = title.substring(0, 57) + '...';
  }
  return title;
}

function generateMetaDescription(result: ResultType): string {
  const programName = result.program?.name || 'exam';
  const institutionName = result.institute?.name || result.board?.name || 'board';
  const cityName = result.institute?.city?.name || result.board?.city?.name || 'Pakistan';
  const year = result.year || '2026';
  const resultDate = result.resultDate ? formatShortDate(result.resultDate) : 'TBA';
  const status = result.status ? 'published' : 'pending';
  
  let description = `Check ${programName} result ${year} for ${institutionName} in ${cityName}. `;
  description += `Result date: ${resultDate}. Status: ${status}. `;
  
  if (result.officialLink) {
    description += `View official result online. `;
  }
  
  description += `Download marksheet, check passing percentage, and more details at NextID.pk.`;
  
  if (description.length > 160) {
    description = description.substring(0, 157) + '...';
  }
  return description;
}

function generateMetaKeywords(result: ResultType): string {
  const programName = result.program?.name || '';
  const institutionName = result.institute?.name || result.board?.name || '';
  const cityName = result.institute?.city?.name || result.board?.city?.name || '';
  const provinceName = result.institute?.city?.province || result.board?.city?.province || '';
  const year = result.year || '2026';
  
  const keywords = [
    programName,
    institutionName,
    cityName,
    provinceName,
    'result',
    `result ${year}`,
    `${programName} result`,
    `${institutionName} result`,
    `${cityName} result`,
    'exam result',
    'board result',
    'university result',
    'Pakistan',
    'marksheet',
    'download result',
    'online result',
    'passing percentage',
    'merit list',
  ].filter(Boolean).join(', ');
  
  return keywords;
}

// ==================== METADATA ====================
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getResultBySlug(slug);

  if (!result) {
    return {
      title: 'Result Not Found | NextID.pk',
      description: 'The requested result could not be found. Browse other results.',
      robots: { index: false },
    };
  }

  const canonicalUrl = `https://www.nextid.pk/results/${result.slug}`;
  const title = generateMetaTitle(result);
  const description = generateMetaDescription(result);
  const keywords = generateMetaKeywords(result);
  const institutionName = result.institute?.name || result.board?.name || 'Institution';
  const cityName = result.institute?.city?.name || result.board?.city?.name || 'Pakistan';
  const imageUrl = '/images/results-og.jpg';

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'article',
      publishedTime: result.createdAt?.toISOString(),
      modifiedTime: result.updatedAt?.toISOString(),
      authors: ['NextID.pk'],
      tags: [
        result.program?.name || 'Exam',
        institutionName,
        cityName,
        `Year ${result.year}`,
        'Result',
      ].filter(Boolean) as string[],
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      siteName: 'NextID.pk',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': 160,
      },
    },
    authors: [{ name: 'NextID.pk', url: 'https://www.nextid.pk' }],
    publisher: 'NextID.pk',
    category: 'Education',
  };
}

// ==================== MAIN PAGE (Server Component) ====================
export default async function ResultDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const result = await getResultBySlug(slug);
  
  if (!result) {
    notFound();
  }

  const relatedResults = await getRelatedResults(result);
  const cityResults = await getCityResults(result);
  const statusBadge = getStatusBadge(result.status);
  const daysRemaining = getDaysRemaining(result.resultDate);

  // Determine institution with proper null handling
  const institutionName = result.institute?.name || result.board?.name || '';
  const institutionSlug = result.institute?.slug || result.board?.slug || '';
  const institutionType = result.institute ? 'universities' : 'boards';
  const cityName = result.institute?.city?.name || result.board?.city?.name || '';
  const provinceName = result.institute?.city?.province || result.board?.city?.province || '';
  
  // Get official website
  const officialWebsite = result.institute?.website || result.board?.website || '';

  // Prepare data for client component - NO FUNCTIONS!
  const serializedResult = {
    ...result,
    resultDate: result.resultDate?.toISOString() || null,
    createdAt: result.createdAt?.toISOString() || null,
    updatedAt: result.updatedAt?.toISOString() || null,
    officialLink: result.officialLink || null,
  };

  const resultData = {
    result: serializedResult,
    relatedResults: relatedResults || [],
    cityResults: cityResults || [],
    statusBadge,
    daysRemaining,
    institutionName,
    institutionSlug,
    institutionType,
    cityName,
    provinceName,
    officialWebsite,
    // ✅ Pass formatted strings instead of functions
    formattedResultDate: formatDate(result.resultDate),
    formattedShortResultDate: formatShortDate(result.resultDate),
    formattedCreatedAt: formatDate(result.createdAt),
    formattedUpdatedAt: formatDate(result.updatedAt || result.createdAt),
  };

  return <ResultClient data={resultData} />;
}