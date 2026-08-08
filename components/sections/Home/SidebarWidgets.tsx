// components/sections/Home/SidebarWidgets.tsx
import Link from 'next/link';
import { sidebarService } from '@/services/sidebar/sidebar.service';
import { TrendingUp, AlertCircle, Zap } from 'lucide-react';

function getTypeInfo(type: string) {
  const types: Record<string, { label: string; icon: string; bgColor: string; textColor: string }> = {
    admission: { label: 'Admissions', icon: '🎓', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
    result: { label: 'Results', icon: '📊', bgColor: 'bg-green-50', textColor: 'text-green-700' },
    news: { label: 'News', icon: '📰', bgColor: 'bg-purple-50', textColor: 'text-purple-700' },
    date_sheet: { label: 'Date Sheets', icon: '📅', bgColor: 'bg-orange-50', textColor: 'text-orange-700' },
    scholarship: { label: 'Scholarships', icon: '💰', bgColor: 'bg-teal-50', textColor: 'text-teal-700' },
    job: { label: 'Jobs', icon: '💼', bgColor: 'bg-indigo-50', textColor: 'text-indigo-700' },
    blog: { label: 'Blog', icon: '✍️', bgColor: 'bg-pink-50', textColor: 'text-pink-700' },
  };
  return types[type] || { label: type, icon: '📄', bgColor: 'bg-gray-50', textColor: 'text-gray-700' };
}

export default async function SidebarWidgets() {
  // ✅ Service handles all caching internally with LIMIT: 10
  const { trending, breaking, featured, quickAccess } = await sidebarService.getSidebarData();
  
  return (
    <div className="space-y-5">
      {/* Trending Widget */}
      {trending.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-gray-800">Trending Now</h3>
            <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full ml-auto">Hot</span>
          </div>
          <div className="space-y-3">
            {trending.slice(0, 5).map((post, index) => {
              const typeInfo = getTypeInfo(post.type);
              return (
                <Link key={post.id} href={`/${post.type}s/${post.slug}`} 
                      className="flex gap-3 p-2 rounded-lg hover:bg-amber-50/30 transition-all group">
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
      )}
      
      {/* Breaking & Featured */}
      {(breaking.length > 0 || featured.length > 0) && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-gray-800">Important News</h3>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full ml-auto animate-pulse">Live</span>
          </div>
          
          {breaking.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-1 mb-2">
                <span className="text-red-500 text-sm">🔴</span>
                <span className="text-xs font-bold text-red-600">Breaking</span>
              </div>
              {breaking.slice(0, 3).map(post => (
                <Link key={post.id} href={`/${post.type}s/${post.slug}`}
                      className="block p-2 rounded-lg hover:bg-red-50 transition-all">
                  <p className="text-sm font-semibold text-gray-800 hover:text-red-600 line-clamp-2">
                    {post.title}
                  </p>
                </Link>
              ))}
            </div>
          )}
          
          {featured.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <span className="text-orange-500 text-sm">⭐</span>
                <span className="text-xs font-bold text-orange-600">Featured</span>
              </div>
              {featured.slice(0, 4).map(post => (
                <Link key={post.id} href={`/${post.type}s/${post.slug}`}
                      className="block p-2 rounded-lg hover:bg-orange-50 transition-all">
                  <p className="text-sm text-gray-700 hover:text-orange-600 line-clamp-2">
                    {post.title}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Quick Access */}
      {Object.keys(quickAccess).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
            <Zap className="w-5 h-5 text-purple-500" />
            <h3 className="font-bold text-gray-800">Quick Access</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(quickAccess)
              .filter(([, count]) => count > 0)
              .slice(0, 6)
              .map(([type, count]) => {
                const typeInfo = getTypeInfo(type);
                const label = type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ') + 's';
                return (
                  <Link key={type} href={`/${type}s`}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg ${typeInfo.bgColor} ${typeInfo.textColor} hover:shadow-md transition-all`}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{typeInfo.icon}</span>
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <span className="text-xs font-bold bg-white/70 px-1.5 py-0.5 rounded">
                      {count}
                    </span>
                  </Link>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}