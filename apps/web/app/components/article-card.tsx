import { useMemo } from "react";
import type { Article } from "@shared/types";

interface ArticleCardProps {
  article: Article;
}

const FALLBACK_SUMMARY = "Summary unavailable.";
const FALLBACK_SOURCE = "Unknown source";
const FALLBACK_TITLE = "Untitled article";
const FALLBACK_DATE = "Date unavailable";

function resolveDomain(link?: string, source?: string): string {
  const normalizedSource = source?.trim();
  if (normalizedSource) {
    return normalizedSource;
  }

  if (!link) {
    return "";
  }

  try {
    const url = new URL(link);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function formatPublishedDate(value?: string): string {
  if (!value) {
    return FALLBACK_DATE;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return FALLBACK_DATE;
  }

  return parsed.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ArticleCard({ article }: ArticleCardProps) {
  const domain = useMemo(
    () => resolveDomain(article.link, article.source),
    [article.link, article.source],
  );
  const published = useMemo(() => formatPublishedDate(article.pubDate), [article.pubDate]);
  const title = article.title?.trim() || FALLBACK_TITLE;
  const summary = article.summary?.trim() || FALLBACK_SUMMARY;
  const hasLink = Boolean(article.link);

  return (
    <article className="group flex-shrink-0 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-sm">
      {/* Image placeholder with gradient */}
      <div className="h-56 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-700 dark:via-gray-600 dark:to-gray-500 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-purple-400/10 dark:from-blue-500/20 dark:to-purple-500/20"></div>
        <div className="text-6xl text-gray-400 dark:text-gray-500 relative z-10">📰</div>
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute top-4 right-4 w-20 h-20 bg-blue-400 rounded-full blur-xl"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 bg-purple-400 rounded-full blur-xl"></div>
        </div>
      </div>
      
      <div className="p-8">
        {/* Source badge */}
        {domain && (
          <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 mb-4 border border-gray-200 dark:border-gray-600">
            {domain}
          </div>
        )}
        
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
          {title}
        </h3>
        
        {/* Summary */}
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-4 mb-6 leading-relaxed">
          {summary}
        </p>
        
        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {published}
          </span>
          
          {hasLink && (
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-all duration-200 group/link"
            >
              Read more
              <svg className="ml-2 w-4 h-4 transition-transform duration-200 group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}