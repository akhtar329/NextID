// components/sections/Home/SidebarWidgets.tsx

import Link from 'next/link';
import { postService } from '@/services/post/post.service';
import { 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  Zap, 
  ChevronRight,
} from 'lucide-react';

// ==================== HELPERS ====================
function getTypeInfo(type: string): { label: string; icon: string; color: string; bgColor: string; textColor: string; hoverBg: string } {
  const types: Record<string, { label: string; icon: string; color: string; bgColor: string; textColor: string; hoverBg: string }> = {
    admission: { label: 'Admissions', icon: '🎓', color: 'blue', bgColor: 'bg-blue-50', textColor: 'text-blue-700', hoverBg: 'hover:bg-blue-100' },
    result: { label: 'Results', icon: '📊', color: 'green', bgColor: 'bg-green-50', textColor: 'text-green-700', hoverBg: 'hover:bg-green-100' },
    news: { label: 'News', icon: '📰', color: 'purple', bgColor: 'bg-purple-50', textColor: 'text-purple-700', hoverBg: 'hover:bg-purple-100' },
    date_sheet: { label: 'Date Sheets', icon: '📅', color: 'orange', bgColor: 'bg-orange-50', textColor: 'text-orange-700', hoverBg: 'hover:bg-orange-100' },
    scholarship: { label: 'Scholarships', icon: '💰', color: 'teal', bgColor: 'bg-teal-50', textColor: 'text-teal-700', hoverBg: 'hover:bg-teal-100' },
    job: { label: 'Jobs', icon: '💼', color: 'indigo', bgColor: 'bg-indigo-50', textColor: 'text-indigo-700', hoverBg: 'hover:bg-indigo-100' },
    blog: { label: 'Blog', icon: '✍️', color: 'pink', bgColor: 'bg-pink-50', textColor: 'text-pink-700', hoverBg: 'hover:bg-pink-100' },
  };
  return types[type] || { label: type, icon: '📄', color: 'gray', bgColor: 'bg-gray-50', textColor: 'text-gray-700', hoverBg: 'hover:bg-gray-100' };
}

// ==================== WIDGET 1: LATEST UPDATES STATS ====================
async function LatestUpdatesWidget() {
  const types = ['admission', 'result', 'news', 'date_sheet', 'scholarship', 'job'];
  
  let latestGlobalDate: Date | null = null;
  
  const allPostsPromises = types.map(type => postService.getPostsByType(type, 500));
  const allPostsArrays = await Promise.all(allPostsPromises);
  const allPosts = allPostsArrays.flat();
  
  for (const post of allPosts) {
    if (post.publishedAt) {
      const postDate = new Date(post.publishedAt);
      if (!latestGlobalDate || postDate > latestGlobalDate) {
        latestGlobalDate = postDate;
      }
    }
  }
  
  if (!latestGlobalDate) return null;
  
  const latestDateStart = new Date(latestGlobalDate);
  latestDateStart.setHours(0, 0, 0, 0);
  const latestDateEnd = new Date(latestGlobalDate);
  latestDateEnd.setHours(23, 59, 59, 999);
  
  const statsData = await Promise.all(
    types.map(async (type) => {
      const posts = await postService.getPostsByType(type, 500);
      
      const postsOnLatestDate = posts.filter(post => {
        if (!post.publishedAt) return false;
        const postDate = new Date(post.publishedAt);
        return postDate >= latestDateStart && postDate <= latestDateEnd;
      });
      
      return {
        type,
        label: getTypeInfo(type).label,
        icon: getTypeInfo(type).icon,
        countOnLatestDate: postsOnLatestDate.length,
        hasData: posts.length > 0,
      };
    })
  );
  
  const totalPostsOnLatestDate = statsData.reduce((total, stat) => total + stat.countOnLatestDate, 0);
  const validStats = statsData.filter(s => s.hasData && s.countOnLatestDate > 0);
  
  if (validStats.length === 0) return null;
  
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
        <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
        <Calendar className="w-5 h-5 text-blue-500" />
        <h3 className="font-bold text-gray-800">Latest Updates</h3>
        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full ml-auto">
          Total: {totalPostsOnLatestDate}
        </span>
      </div>
      
      <div className="space-y-2">
        {validStats.map((stat) => (
          <Link
            key={stat.type}
            href={`/${stat.type}s`}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <div className="font-medium text-gray-800">{stat.label}</div>
                <div className="text-xs text-green-600">
                  +{stat.countOnLatestDate} new
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ==================== WIDGET 2: TRENDING NOW ====================
async function TrendingWidget() {
  const types = ['admission', 'result', 'news', 'date_sheet', 'scholarship', 'job'];
  
  const allPostsPromises = types.map(type => postService.getPostsByType(type, 100));
  const allPostsArrays = await Promise.all(allPostsPromises);
  const allPosts = allPostsArrays.flat();
  
  const trendingPosts = allPosts
    .filter(p => p.status === 'published' && (p.isPopular === true || p.isFeatured === true || p.isBreaking === true))
    .sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);
  
  if (trendingPosts.length === 0) return null;
  
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
        <div className="w-1 h-5 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></div>
        <TrendingUp className="w-5 h-5 text-amber-500" />
        <h3 className="font-bold text-gray-800">Trending Now</h3>
        <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full ml-auto">
          Hot
        </span>
      </div>
      
      <div className="space-y-3">
        {trendingPosts.map((post, index) => {
          const typeInfo = getTypeInfo(post.type);
          return (
            <Link
              key={post.id}
              href={`/${post.type}s/${post.slug}`}
              className="flex gap-3 p-2 rounded-lg hover:bg-amber-50/30 transition-all group"
            >
              <div className="flex-shrink-0 w-6 text-center">
                <span className="text-lg font-bold text-amber-500">{index + 1}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800 group-hover:text-amber-600 line-clamp-2">
                  {post.title}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs">{typeInfo.icon}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${typeInfo.bgColor} ${typeInfo.textColor}`}>
                    {typeInfo.label}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ==================== WIDGET 3: IMPORTANT NEWS ====================
async function ImportantNewsWidget() {
  const [newsPosts, admissionPosts] = await Promise.all([
    postService.getPostsByType('news', 100),
    postService.getPostsByType('admission', 100),
  ]);
  
  const allPosts = [...newsPosts, ...admissionPosts];
  
  const breakingPosts = allPosts
    .filter(p => p.isBreaking === true && p.status === 'published')
    .sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 4);
  
  const featuredPosts = allPosts
    .filter(p => p.isFeatured === true && p.status === 'published' && !p.isBreaking)
    .sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 3);
  
  if (breakingPosts.length === 0 && featuredPosts.length === 0) return null;
  
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
        <div className="w-1 h-5 bg-gradient-to-b from-red-500 to-pink-500 rounded-full"></div>
        <AlertCircle className="w-5 h-5 text-red-500" />
        <h3 className="font-bold text-gray-800">Important News</h3>
        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full ml-auto animate-pulse">
          Live
        </span>
      </div>
      
      {breakingPosts.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1 mb-2">
            <span className="text-red-500 text-sm">🔴</span>
            <span className="text-xs font-bold text-red-600 uppercase tracking-wide">Breaking</span>
          </div>
          <div className="space-y-2">
            {breakingPosts.map((post) => (
              <Link
                key={post.id}
                href={`/${post.type}s/${post.slug}`}
                className="block p-2 rounded-lg hover:bg-red-50 transition-all group"
              >
                <p className="text-sm font-semibold text-gray-800 group-hover:text-red-600 line-clamp-2">
                  {post.title}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {featuredPosts.length > 0 && (
        <div>
          <div className="flex items-center gap-1 mb-2">
            <span className="text-orange-500 text-sm">⭐</span>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">Featured</span>
          </div>
          <div className="space-y-2">
            {featuredPosts.map((post) => (
              <Link
                key={post.id}
                href={`/${post.type}s/${post.slug}`}
                className="block p-2 rounded-lg hover:bg-orange-50 transition-all group"
              >
                <p className="text-sm text-gray-700 group-hover:text-orange-600 line-clamp-2">
                  {post.title}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== WIDGET 4: QUICK ACCESS ====================
async function QuickAccessWidget() {
  const types = ['admission', 'result', 'news', 'date_sheet', 'scholarship', 'job'];
  
  const typeData = await Promise.all(
    types.map(async (type) => {
      const posts = await postService.getPostsByType(type, 100);
      return {
        type,
        label: getTypeInfo(type).label,
        icon: getTypeInfo(type).icon,
        bgColor: getTypeInfo(type).bgColor,
        textColor: getTypeInfo(type).textColor,
        count: posts.length,
        hasData: posts.length > 0,
      };
    })
  );
  
  const activeTypes = typeData.filter(t => t.hasData);
  
  if (activeTypes.length === 0) return null;
  
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
        <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full"></div>
        <Zap className="w-5 h-5 text-purple-500" />
        <h3 className="font-bold text-gray-800">Quick Access</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {activeTypes.map(({ type, label, icon, bgColor, textColor, count }) => (
          <Link
            key={type}
            href={`/${type}s`}
            className={`flex items-center justify-between px-3 py-2 rounded-lg ${bgColor} ${textColor} hover:shadow-md transition-all group`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{icon}</span>
              <span className="text-sm font-medium">{label}</span>
            </div>
            <span className="text-xs font-bold bg-white/70 px-1.5 py-0.5 rounded">
              {count}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default async function SidebarWidgets() {
  return (
    <div className="space-y-5">
      <LatestUpdatesWidget />
      <TrendingWidget />
      <ImportantNewsWidget />
      <QuickAccessWidget />
    </div>
  );
}