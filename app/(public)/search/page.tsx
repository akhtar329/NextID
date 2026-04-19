// app/(public)/search/SearchContent.tsx

import Link from "next/link";
import { Suspense } from "react";

type SearchItem = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  publishedAt?: string;
};

async function getSearchResults(query: string, page: number) {
  try {
    const q = encodeURIComponent(query || "");

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/public/search?q=${q}&page=${page}`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    return Array.isArray(data?.data) ? data.data : [];
  } catch (error) {
    console.error("Search API error:", error);
    return [];
  }
}

// Safe number parser (IMPORTANT FIX)
function safeNumber(value: any, fallback = 1) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

export default async function SearchContent({
  searchParams,
}: {
  searchParams?: {
    q?: string;
    page?: string;
  };
}) {
  const query = searchParams?.q || "";
  const page = safeNumber(searchParams?.page, 1);

  const results = await getSearchResults(query, page);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <h1 className="text-2xl font-bold mb-4">
        Search Results {query ? `for "${query}"` : ""}
      </h1>

      {/* No query */}
      {!query && (
        <p className="text-gray-500">
          Please enter something to search.
        </p>
      )}

      {/* Empty results */}
      {query && results.length === 0 && (
        <p className="text-gray-500">
          No results found.
        </p>
      )}

      {/* Results list */}
      <div className="space-y-4 mt-6">
        {results.map((item: SearchItem) => (
          <Link
            key={item.id}
            href={`/news/${item.slug}`}
            className="block p-4 border rounded-lg hover:shadow transition"
          >
            <h2 className="font-semibold text-lg">{item.title}</h2>
            {item.excerpt && (
              <p className="text-sm text-gray-600 mt-1">
                {item.excerpt}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}