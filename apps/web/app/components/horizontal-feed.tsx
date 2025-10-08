import { useRef, useEffect } from 'react';
import { ArticleCard } from './article-card';
import type { Article } from '@shared/types';

interface HorizontalFeedProps {
  articles: Article[];
  loading?: boolean;
}

export function HorizontalFeed({ articles, loading = false }: HorizontalFeedProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Smooth scroll functionality
  const scrollToNext = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 400, // width of one card + gap (updated for new card width)
        behavior: 'smooth'
      });
    }
  };

  const scrollToPrev = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -400,
        behavior: 'smooth'
      });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        scrollToPrev();
      } else if (e.key === 'ArrowRight') {
        scrollToNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex gap-8 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-96 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse">
              <div className="h-56 bg-gray-300 dark:bg-gray-600 rounded-t-2xl"></div>
              <div className="p-8">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded-full mb-4 w-20"></div>
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-3"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-6 w-3/4"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-8xl mb-6 opacity-50">📰</div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          No articles found
        </h3>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Try adjusting your keywords or adding more RSS feeds to discover the latest news.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Navigation arrows */}
      <button
        onClick={scrollToPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-xl rounded-full p-3 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 hover:scale-110 border border-gray-200 dark:border-gray-700"
        aria-label="Previous articles"
      >
        <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={scrollToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-xl rounded-full p-3 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 hover:scale-110 border border-gray-200 dark:border-gray-700"
        aria-label="Next articles"
      >
        <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Horizontal scrollable container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-8 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-6 px-16"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {articles.map((article) => (
          <div key={article.id} className="snap-start">
            <ArticleCard article={article} />
          </div>
        ))}
      </div>

      {/* Scroll hint */}
      <div className="text-center mt-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          Use ← → arrow keys or swipe to navigate • Scroll horizontally to explore more
        </p>
      </div>
    </div>
  );
}
