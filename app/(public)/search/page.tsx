import { SearchService } from '@/services/search/search.service';
import SearchInput from '@/components/ui/SearchInput'; // SearchInput use karna hai to

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || '';
  const page = parseInt(params.page || '1');

  let results = null;
  
  if (query) {
    const searchService = new SearchService();
    results = await searchService.search({
      query,
      page,
      limit: 20,
      type: 'all'
    });
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* SearchInput sirf value aur onChange leta hai, initialResults nahi */}
      <SearchInput 
        value={query}
        onChange={(newQuery) => {
          // Client-side redirect ya fetch
        }}
        placeholder="Search..."
      />
      
      {/* Results yahan display karo */}
      {results && (
        <div>
          {results.results.map(result => (
            <div key={result.id}>{result.title}</div>
          ))}
        </div>
      )}
    </main>
  );
}