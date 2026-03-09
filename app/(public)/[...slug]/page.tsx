// app/(public)/[...slug]/page.tsx

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import HeroSection from '@/app/component/sections/Home/HeroSection';

interface Props {
  params: Promise<{
    slug?: string[];
  }>;
}

export default async function DynamicPage({ params }: Props) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  if (!slug || !Array.isArray(slug) || slug.length === 0) {
    notFound();
  }
  
  const [category, ...rest] = slug;
  
  // Valid categories
  const validCategories = [
    'admissions', 'results', 'news', 'boards', 'universities',
    'institutes', 'programs', 'cities', 'categories', 
    'degrees', 'levels', 'date-sheets'
  ];
  
  if (!validCategories.includes(category)) {
    notFound();
  }
  
  // ✅ Handle different URL patterns with redirects to existing pages
  
  // /institutes/cities/islamabad → redirect to /cities/islamabad/institutes
  if (category === 'institutes' && rest[0] === 'cities' && rest[1]) {
    redirect(`/cities/${rest[1]}/institutes`);
  }
  
  // /institutes/universities/pu → redirect to /universities/pu
  if (category === 'institutes' && rest[0] === 'universities' && rest[1]) {
    redirect(`/universities/${rest[1]}`);
  }
  
  // /institutes/programs/cs → redirect to /programs/cs/institutes
  if (category === 'institutes' && rest[0] === 'programs' && rest[1]) {
    redirect(`/programs/${rest[1]}/institutes`);
  }
  
  // /universities/pu/admissions → redirect to /admissions/universities/pu
  if (category === 'universities' && rest[0] && rest[1] === 'admissions') {
    redirect(`/admissions/universities/${rest[0]}`);
  }
  
  // /universities/pu/programs → redirect to /programs/universities/pu
  if (category === 'universities' && rest[0] && rest[1] === 'programs') {
    redirect(`/programs/universities/${rest[0]}`);
  }
  
  // /admissions/programs/cs → redirect to /programs/cs/admissions
  if (category === 'admissions' && rest[0] === 'programs' && rest[1]) {
    redirect(`/programs/${rest[1]}/admissions`);
  }
  
  // /admissions/universities/pu → redirect to /universities/pu/admissions
  if (category === 'admissions' && rest[0] === 'universities' && rest[1]) {
    redirect(`/universities/${rest[1]}/admissions`);
  }
  
  // /admissions/cities/lahore → redirect to /cities/lahore/admissions
  if (category === 'admissions' && rest[0] === 'cities' && rest[1]) {
    redirect(`/cities/${rest[1]}/admissions`);
  }
  
  // /results/boards/bise-lahore → redirect to /boards/bise-lahore/results
  if (category === 'results' && rest[0] === 'boards' && rest[1]) {
    redirect(`/boards/${rest[1]}/results`);
  }
  
  // /results/universities/pu → redirect to /universities/pu/results
  if (category === 'results' && rest[0] === 'universities' && rest[1]) {
    redirect(`/universities/${rest[1]}/results`);
  }
  
  // /cities/lahore/institutes → already correct
  // /cities/lahore/universities → already correct
  
  // /boards/bise-lahore/results → already correct
  // /boards/bise-lahore/date-sheets → already correct
  
  // /programs/cs/institutes → already correct
  
  // Default: show the page with HeroSection
  const getPageTitle = () => {
    if (rest.length === 0) return `All ${category}`;
    return rest.map(part => 
      part.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    ).join(' / ');
  };
  
  return (
    <div>
      <HeroSection 
        category={category}
        currentPath={`/${slug.join('/')}`}
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {getPageTitle()}
          </h1>
          <p className="text-gray-600">
            {category === 'institutes' && 'Educational institutes and colleges'}
            {category === 'universities' && 'Universities across Pakistan'}
            {category === 'programs' && 'Academic programs and courses'}
            {category === 'admissions' && 'Latest admission openings'}
            {category === 'results' && 'Recent exam results'}
            {category === 'boards' && 'Education boards information'}
            {category === 'cities' && 'Educational institutions by city'}
          </p>
        </div>
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8 flex-wrap">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          {slug.map((part, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-gray-300">/</span>
              <Link 
                href={`/${slug.slice(0, index + 1).join('/')}`}
                className="hover:text-blue-600 capitalize"
              >
                {part.split('-').join(' ')}
              </Link>
            </div>
          ))}
        </div>
        
        {/* Content - Show message that this is a listing page */}
        <div className="min-h-[400px] bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">
            {category === 'institutes' && '🏛️'}
            {category === 'universities' && '🎓'}
            {category === 'programs' && '📚'}
            {category === 'admissions' && '📝'}
            {category === 'results' && '📊'}
            {category === 'boards' && '📋'}
            {category === 'cities' && '🏙️'}
            {category === 'news' && '📰'}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {getPageTitle()}
          </h2>
          <p className="text-gray-500 mb-6">
            {rest.length > 0 
              ? `Browse ${rest.join(' / ')} in ${category}`
              : `Browse all ${category} on NextID.pk`
            }
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              href={`/${category}`}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All {category}
            </Link>
            <Link 
              href="/search"
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Search
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Metadata
export async function generateMetadata({ params }: Props) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  if (!slug || !Array.isArray(slug) || slug.length === 0) {
    return {
      title: 'Page Not Found | NextID.pk',
      description: 'The requested page could not be found.'
    };
  }
  
  const [category, ...rest] = slug;
  
  const titles: Record<string, string> = {
    admissions: 'Admissions',
    results: 'Results',
    news: 'News',
    boards: 'Boards',
    universities: 'Universities',
    institutes: 'Institutes',
    programs: 'Programs',
    cities: 'Cities',
    categories: 'Categories',
    degrees: 'Degrees',
    levels: 'Levels',
    'date-sheets': 'Date Sheets'
  };
  
  const baseTitle = titles[category] || category;
  const restTitle = rest.length > 0 ? ` - ${rest.map(r => r.split('-').join(' ')).join(' / ')}` : '';
  
  return {
    title: `${baseTitle}${restTitle} | NextID.pk`,
    description: `Find latest ${category} information in Pakistan.`
  };
}