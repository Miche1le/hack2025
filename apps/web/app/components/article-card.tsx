import { useMemo } from "react";

export interface Article {
  title?: string;
  link?: string;
  pubDate?: string;
  source?: string;
  summary?: string;
}

interface ArticleCardProps {
  article: Article;
}

const FALLBACK_SUMMARY = "Сводка недоступна.";
const FALLBACK_SOURCE = "Источник неизвестен";
const FALLBACK_TITLE = "Без заголовка";
const FALLBACK_DATE = "Дата неизвестна";

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

  return parsed.toLocaleString("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export function ArticleCard({ article }: ArticleCardProps) {
  const domain = useMemo(
    () => resolveDomain(article.link, article.source),
    [article.link, article.source]
  );
  const published = useMemo(
    () => formatPublishedDate(article.pubDate),
    [article.pubDate]
  );
  const title = article.title?.trim() || FALLBACK_TITLE;
  const summary = article.summary?.trim() || FALLBACK_SUMMARY;
  const hasLink = Boolean(article.link);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition focus-within:shadow-md hover:shadow-md">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <a
          href={article.link ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lg font-semibold text-slate-900 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          onClick={(event) => {
            if (!hasLink) {
              event.preventDefault();
            }
          }}
          title={title}
        >
          <span
            className="line-clamp-2"
            style={{
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
              overflow: "hidden"
            }}
          >
            {title}
          </span>
        </a>
        {domain ? (
          <span className="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
            {domain}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-slate-500">{published}</p>
      <p
        className="mt-3 text-sm leading-6 text-slate-700"
        style={{
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 4,
          overflow: "hidden"
        }}
      >
        {summary}
      </p>
      {hasLink ? (
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center text-sm font-semibold text-blue-600 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          Читать первоисточник
        </a>
      ) : (
        <span className="mt-4 inline-block text-sm text-slate-500">{FALLBACK_SOURCE}</span>
      )}
    </article>
  );
}
