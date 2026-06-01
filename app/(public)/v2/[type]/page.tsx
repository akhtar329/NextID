// app/(public)/v2/[type]/page.tsx

import { notFound } from "next/navigation";
import { postService } from "@/services/post/post.service";
import { generateSEOClient } from "@/lib/seo";
import type { Metadata } from "next";

// ==================== TYPES ====================
interface PageProps {
  params: Promise<{
    type: string;
  }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
  }>;
}

// ==================== VALID TYPES ====================
const VALID_TYPES = [
  "admission",
  "result", 
  "news",
  "date-sheet",
  "scholarship",
  "blog"
];

const TYPE_TITLES: Record<string, string> = {
  admission: "Admissions",
  result: "Results",
  news: "News",
  "date-sheet": "Date Sheets",
  scholarship: "Scholarships",
  blog: "Blog"
};

const TYPE_DESCRIPTIONS: Record<string, string> = {
  admission: "Latest admission announcements from universities and colleges across Pakistan",
  result: "Check exam results from all educational boards and universities",
  news: "Latest education news, updates, and announcements",
  "date-sheet": "Exam date sheets for annual and supplementary examinations",
  scholarship: "Find scholarships for Pakistani students locally and abroad",
  blog: "Educational articles, tips, and guides"
};

// ==================== SEO ====================
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type } = await params;
  
  if (!VALID_TYPES.includes(type)) {
    return {
      title: "Page Not Found",
      robots: "noindex, nofollow",
    };
  }

  const title = `${TYPE_TITLES[type]} 2026 - Latest ${TYPE_TITLES[type]} in Pakistan | NextID`;
  const description = TYPE_DESCRIPTIONS[type];

  return generateSEOClient({
    path: `/v2/${type}`,
    title,
    description,
  });
}

// ==================== PAGE COMPONENT ====================
export default async function TypePage({ params, searchParams }: PageProps) {
  const { type } = await params;
  const { page = "1", limit = "10" } = await searchParams;
  
  // ✅ Validate type
  if (!VALID_TYPES.includes(type)) {
    notFound();
  }

  const currentPage = parseInt(page);
  const pageLimit = parseInt(limit);
  const offset = (currentPage - 1) * pageLimit;

  // ✅ Service se data fetch - Cache automatically handle hoga
  const posts = await postService.getPostsByType(type, pageLimit, offset);
  const totalPosts = await postService.getTotalCountByType(type);
  
  const totalPages = Math.ceil(totalPosts / pageLimit);

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {TYPE_TITLES[type]}
          </h1>
          <p className="text-gray-600">
            {TYPE_DESCRIPTIONS[type]}
          </p>
        </div>

        {/* POSTS GRID */}
        {posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No {TYPE_TITLES[type].toLowerCase()} found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} type={type} />
            ))}
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            type={type}
          />
        )}
      </div>
    </div>
  );
}

// ==================== POST CARD COMPONENT ====================
function PostCard({ post, type }: { post: any; type: string }) {
  const getBadgeColor = () => {
    switch (type) {
      case "admission": return "bg-green-100 text-green-800";
      case "result": return "bg-blue-100 text-blue-800";
      case "news": return "bg-red-100 text-red-800";
      case "date-sheet": return "bg-purple-100 text-purple-800";
      case "scholarship": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getDateLabel = () => {
    switch (type) {
      case "admission": return "Deadline:";
      case "result": return "Result Date:";
      case "date-sheet": return "Exam Date:";
      case "scholarship": return "Deadline:";
      default: return "Published:";
    }
  };

  const getDateValue = () => {
    if (type === "admission" && post.meta?.closeDate) {
      return new Date(post.meta.closeDate).toLocaleDateString();
    }
    if (type === "result" && post.meta?.resultDate) {
      return new Date(post.meta.resultDate).toLocaleDateString();
    }
    if (type === "date-sheet" && post.meta?.examDate) {
      return new Date(post.meta.examDate).toLocaleDateString();
    }
    if (post.publishedAt) {
      return new Date(post.publishedAt).toLocaleDateString();
    }
    return null;
  };

  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {post.featuredImage && (
        <img
          src={post.featuredImage}
          alt={post.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getBadgeColor()}`}>
            {TYPE_TITLES[type]}
          </span>
          {post.viewCount !== null && (
            <span className="text-xs text-gray-500">👁️ {post.viewCount} views</span>
          )}
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
          <a href={`/v2/${type}/${post.slug}`} className="hover:text-blue-600">
            {post.title}
          </a>
        </h2>
        
        {post.excerpt && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {post.excerpt}
          </p>
        )}
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          {getDateValue() && (
            <span>{getDateLabel()} {getDateValue()}</span>
          )}
          <a href={`/v2/${type}/${post.slug}`} className="text-blue-600 hover:underline">
            Read more →
          </a>
        </div>
      </div>
    </article>
  );
}

// ==================== PAGINATION COMPONENT ====================
function Pagination({ currentPage, totalPages, type }: { 
  currentPage: number; 
  totalPages: number; 
  type: string;
}) {
  const pages = [];
  const maxVisible = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      {currentPage > 1 && (
        <a
          href={`/v2/${type}?page=${currentPage - 1}`}
          className="px-3 py-2 rounded border hover:bg-gray-50"
        >
          ← Previous
        </a>
      )}
      
      {startPage > 1 && (
        <>
          <a href={`/v2/${type}?page=1`} className="px-3 py-2 rounded border hover:bg-gray-50">
            1
          </a>
          {startPage > 2 && <span className="px-2">...</span>}
        </>
      )}
      
      {pages.map((page) => (
        <a
          key={page}
          href={`/v2/${type}?page=${page}`}
          className={`px-3 py-2 rounded border ${
            page === currentPage
              ? "bg-blue-600 text-white border-blue-600"
              : "hover:bg-gray-50"
          }`}
        >
          {page}
        </a>
      ))}
      
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-2">...</span>}
          <a
            href={`/v2/${type}?page=${totalPages}`}
            className="px-3 py-2 rounded border hover:bg-gray-50"
          >
            {totalPages}
          </a>
        </>
      )}
      
      {currentPage < totalPages && (
        <a
          href={`/v2/${type}?page=${currentPage + 1}`}
          className="px-3 py-2 rounded border hover:bg-gray-50"
        >
          Next →
        </a>
      )}
    </div>
  );
}