import { useMemo } from "react";
import type { Article } from "@/types";

interface ArticleCardProps {
  article: Article;
  isFavorite?: boolean;
  isRead?: boolean;
  onToggleFavorite?: () => void;
  onMarkRead?: () => void;
  theme?: "light" | "dark";
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
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ArticleCard({ 
  article, 
  isFavorite = false, 
  isRead = false,
  onToggleFavorite,
  onMarkRead, 
  theme = "light" 
}: ArticleCardProps) {
  const domain = useMemo(
    () => resolveDomain(article.link, article.source),
    [article.link, article.source],
  );
  const published = useMemo(() => formatPublishedDate(article.pubDate), [article.pubDate]);
  const title = article.title?.trim() || FALLBACK_TITLE;
  const summary = article.summary?.trim() || FALLBACK_SUMMARY;
  const hasLink = Boolean(article.link);

  return (
    <article 
      className="group relative border-b py-8 transition-opacity duration-300 hover-card"
      style={{ 
        borderColor: "var(--card-border)",
        opacity: isRead ? 0.4 : 1
      }}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          {/* Meta */}
          <div className="mb-3 flex items-center gap-3 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            {domain && <span className="uppercase tracking-wider">{domain}</span>}
            <span>·</span>
            <time dateTime={article.pubDate ?? undefined}>{published}</time>
          </div>

          {/* Title */}
          <a
            href={article.link ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => {
              if (!hasLink) {
                event.preventDefault();
              } else if (onMarkRead) {
                onMarkRead();
              }
            }}
            title={title}
            className="block mb-4"
          >
            <h3 
              className="text-2xl md:text-3xl font-bold tracking-tight line-clamp-2 transition-opacity group-hover:opacity-60"
              style={{ color: "var(--text-primary)" }}
            >
              {title}
            </h3>
          </a>

          {/* Summary */}
          <p 
            className="text-base leading-relaxed line-clamp-2 mb-4"
            style={{ color: "var(--text-secondary)" }}
          >
            {summary}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {hasLink && (
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium underline underline-offset-4 transition-opacity hover:opacity-60"
                style={{ color: "var(--text-primary)" }}
                onClick={() => onMarkRead?.()}
              >
                Read →
              </a>
            )}
          </div>
        </div>

        {/* Favorite Button */}
        {onToggleFavorite && (
          <button
            onClick={onToggleFavorite}
            className="shrink-0 p-2 transition-opacity hover:opacity-60"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {isFavorite ? (
              <svg className="h-6 w-6" fill="var(--accent)" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-6 w-6" style={{ color: "var(--text-secondary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </button>
        )}
      </div>
    </article>
  );
}
