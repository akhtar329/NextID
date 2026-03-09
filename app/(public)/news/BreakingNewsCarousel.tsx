// app/(public)/news/BreakingNewsCarousel.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { NewsItem, formatDate } from '@/app/types/types';

interface BreakingNewsCarouselProps {
  breakingNews: NewsItem[];
}

export function BreakingNewsCarousel({ breakingNews }: BreakingNewsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const currentNews = breakingNews[currentIndex];
  const otherNews = breakingNews.filter((_, index) => index !== currentIndex);

  const goToPrevious = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? breakingNews.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) => 
      prev === breakingNews.length - 1 ? 0 : prev + 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (breakingNews.length === 0) return null;

  const hasImage = !!currentNews.imageUrl;

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg shadow-lg">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <span className="font-bold tracking-wider">BREAKING NEWS</span>
          </div>
          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
            {breakingNews.length} Updates
          </span>
        </div>
        <Link 
          href="/news/breaking"
          className="text-sm text-gray-600 hover:text-red-600 flex items-center gap-1 transition-colors"
        >
          View All
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Main Carousel */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
        <div className="relative h-[400px] md:h-[450px] w-full">
          <Link
            href={`/news/${currentNews.slug}`}
            className="block relative h-full w-full"
          >
            <div className="absolute inset-0">
              {hasImage ? (
                <img
                  src={currentNews.imageUrl!}
                  alt={currentNews.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center">
                  <span className="text-8xl text-white/30">📰</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
            </div>
            
            <div className="relative h-full flex items-end">
              <div className="p-6 md:p-10 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-red-600 text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    BREAKING #{currentIndex + 1}
                  </span>
                  <span className="bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                    {formatDate(currentNews.publishedAt)}
                  </span>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold mb-3 max-w-3xl line-clamp-3">
                  {currentNews.title}
                </h2>
                
                {currentNews.excerpt && (
                  <p className="text-lg text-gray-200 mb-4 max-w-2xl line-clamp-2">
                    {currentNews.excerpt}
                  </p>
                )}
                
                <div className="flex items-center gap-6">
                  <span className="flex items-center gap-2 text-gray-300">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                    {currentNews.source || 'Exclusive Report'}
                  </span>
                </div>
              </div>
            </div>
          </Link>

          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {breakingNews.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={`transition-all ${
                  idx === currentIndex 
                    ? 'w-8 h-2 bg-white' 
                    : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                } rounded-full`}
              />
            ))}
          </div>

          <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
            {currentIndex + 1} / {breakingNews.length}
          </div>
        </div>
      </div>

      {/* Bottom Mini Cards */}
      {otherNews.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-2">More Breaking News:</p>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {otherNews.map((item) => {
              const originalIndex = breakingNews.findIndex(n => n.id === item.id);
              const hasImage = !!item.imageUrl;
              
              return (
                <div
                  key={item.id}
                  onClick={() => goToSlide(originalIndex)}
                  className="flex-none w-48 cursor-pointer"
                >
                  <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-200 hover:border-red-300">
                    <div className={`h-20 ${hasImage ? 'bg-gray-100' : 'bg-gradient-to-r from-red-600 to-red-700'} relative`}>
                      {hasImage ? (
                        <img
                          src={item.imageUrl!}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl text-white/80">📰</span>
                        </div>
                      )}
                      <div className="absolute top-1 left-1 bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
                        {originalIndex + 1}
                      </div>
                    </div>
                    <div className="p-2">
                      <h4 className="font-medium text-gray-900 text-xs line-clamp-2">
                        {item.title}
                      </h4>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}