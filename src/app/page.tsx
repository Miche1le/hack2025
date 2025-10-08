"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArticleCard } from "@/components/ArticleCard";
import type { Article, FetchResponse } from "@/types";
import { dedupeItems, filterItemsByQuery } from "@/lib/feed-utils";
import { loadFeed } from "@/lib/rss-parser";
import summarizer from "@/lib/summarizer";

const DEFAULT_FEED = "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml";
const EMPTY_FEED_ERROR = "Add at least one RSS feed URL.";
const GENERIC_FETCH_ERROR = "Unable to refresh feeds. Please try again.";
const MAX_FEEDS = 15;

const parseFeeds = (input: string): string[] =>
  input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

export default function HomePage() {
  const [feedsInput, setFeedsInput] = useState(DEFAULT_FEED);
  const [query, setQuery] = useState("");
  const [intervalInput, setIntervalInput] = useState("15");
  const [articles, setArticles] = useState<Article[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const lastUpdatedLabel = useMemo(
    () => (lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null),
    [lastUpdated],
  );

  const warningsLabel = useMemo(() => {
    if (warnings.length === 0) {
      return null;
    }
    return warnings.length === 1 ? "One feed could not be loaded:" : `${warnings.length} feeds could not be loaded:`;
  }, [warnings]);

  const sanitizedInterval = useMemo(() => {
    const numeric = Number.parseInt(intervalInput, 10);
    return Number.isNaN(numeric) || numeric < 1 ? 1 : numeric;
  }, [intervalInput]);

  const abortRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<{ feeds: string[]; query: string } | null>(null);
  const didInitialFetchRef = useRef(false);

  const performFetch = useCallback(
    async (feeds: string[], currentQuery: string, reason: "manual" | "auto" | "initial") => {
      if (feeds.length === 0) {
        setArticles([]);
        setWarnings([]);
        setHasFetched(true);
        setLoading(false);
        setError(EMPTY_FEED_ERROR);
        setLastUpdated(null);
        return;
      }

      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      if (reason !== "auto") {
        setError(null);
        setWarnings([]);
      }
      setLoading(true);

      try {
        // Локальная обработка фидов
        const feedResults = await Promise.allSettled(
          feeds.map((feedUrl) => loadFeed(feedUrl))
        );

        const collectedItems: any[] = [];
        const failures: string[] = [];

        feedResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            collectedItems.push(...result.value);
          } else {
            const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
            failures.push(feeds[index] + ': ' + reason);
          }
        });

        if (collectedItems.length === 0) {
          setError('No stories could be retrieved. Check the feed URLs and try again.');
          setWarnings(failures);
          setArticles([]);
          setLastUpdated(null);
          return;
        }

        // Фильтрация и дедупликация
        const queryTerms = currentQuery
          .split(/[\n,]/)
          .map((term) => term.trim().toLowerCase())
          .filter(Boolean);

        const filtered = filterItemsByQuery(collectedItems, queryTerms);
        const uniqueItems = dedupeItems(filtered);

        // Сортировка по дате публикации
        const orderedItems = [...uniqueItems].sort((a, b) => {
          const timeA = a.pubDate ? Date.parse(a.pubDate) : 0;
          const timeB = b.pubDate ? Date.parse(b.pubDate) : 0;
          return timeB - timeA;
        });

        // Генерация резюме
        const summarized = await Promise.all(
          orderedItems.map(async (item) => {
            const baseText = (item.content?.trim() || item.contentSnippet || item.title || '').trim();
            const safeBase = baseText.length > 0 ? baseText : 'No summary available.';
            let summary = safeBase;

            try {
              const generated = await summarizer.summarize(safeBase, item.title);
              summary = generated && generated.trim().length > 0 ? generated.trim() : safeBase;
            } catch (error) {
              console.warn('Failed to summarize feed item', { link: item.link, error });
            }

            return {
              id: `${item.title}::${item.source}::${item.link}`,
              title: item.title,
              link: item.link,
              source: item.source,
              pubDate: item.pubDate,
              summary,
            } as Article;
          })
        );

        setArticles(summarized);
        setWarnings(failures);
        setError(null);
        setLastUpdated(new Date());
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }
        const message = fetchError instanceof Error && fetchError.message ? fetchError.message : GENERIC_FETCH_ERROR;
        setError(message);
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        setLoading(false);
        setHasFetched(true);
      }
    },
    [],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const feeds = parseFeeds(feedsInput);
      const normalizedQuery = query.trim();

      lastRequestRef.current = feeds.length === 0 ? null : { feeds, query: normalizedQuery };
      await performFetch(feeds, normalizedQuery, "manual");
    },
    [feedsInput, query, performFetch],
  );

  useEffect(() => {
    if (didInitialFetchRef.current) {
      return;
    }
    didInitialFetchRef.current = true;

    const feeds = parseFeeds(DEFAULT_FEED);
    lastRequestRef.current = { feeds, query: "" };
    void performFetch(feeds, "", "initial");
  }, [performFetch]);

  useEffect(() => {
    if (!hasFetched) {
      return;
    }

    const intervalMs = sanitizedInterval * 60 * 1000;
    if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
      return;
    }

    const timerId = window.setInterval(() => {
      const snapshot = lastRequestRef.current;
      if (!snapshot) {
        return;
      }
      void performFetch(snapshot.feeds, snapshot.query, "auto");
    }, intervalMs);

    return () => {
      window.clearInterval(timerId);
    };
  }, [hasFetched, sanitizedInterval, performFetch]);

  const showEmptyState = hasFetched && !loading && !error && articles.length === 0;

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">News briefing dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">
          Gather the feeds you care about in one place: paste RSS URLs, add keywords, and skim the summaries.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="space-y-2">
          <label htmlFor="feeds" className="block text-sm font-semibold text-slate-800">
            RSS feeds (one per line)
          </label>
          <p className="text-xs text-slate-500">Paste up to {MAX_FEEDS} feed URLs. Each line should contain a single address.</p>
          <textarea
            id="feeds"
            name="feeds"
            value={feedsInput}
            onChange={(event) => setFeedsInput(event.target.value)}
            rows={5}
            spellCheck={false}
            className="w-full rounded-md border border-slate-300 bg-white p-3 text-sm text-slate-900 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            placeholder="https://example.com/feed.xml"
          />
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1 space-y-2">
            <label htmlFor="query" className="block text-sm font-semibold text-slate-800">
              Keywords
            </label>
            <input
              id="query"
              name="query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ai, space, economy"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              autoComplete="off"
            />
            <p className="text-xs text-slate-500">Only stories containing these words in the title or summary are kept.</p>
          </div>

          <div className="w-full max-w-[140px] space-y-2">
            <label htmlFor="interval" className="block text-sm font-semibold text-slate-800">
              Refresh interval (min)
            </label>
            <input
              id="interval"
              name="interval"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={intervalInput}
              onChange={(event) => setIntervalInput(event.target.value)}
              onBlur={() => setIntervalInput(String(sanitizedInterval))}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              aria-describedby="interval-help"
            />
            <p id="interval-help" className="text-xs text-slate-500">
              Auto refresh every {sanitizedInterval} minute(s).
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:bg-blue-400"
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <p className="text-xs text-slate-500">
            Auto refresh every {sanitizedInterval} minute(s)
          {lastUpdatedLabel ? ` - Last refreshed at ${lastUpdatedLabel}` : ""}
          </p>
        </div>
      </form>

      <section className="space-y-4" aria-live="polite" aria-busy={loading}>
        {error ? (
          <div
            role="alert"
            className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {error}
          </div>
        ) : null}

        {warnings.length > 0 ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <strong className="block font-semibold">{warningsLabel ?? "Feed load warnings:"}</strong>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-slate-600" role="status">
            Refreshing feeds...
          </p>
        ) : null}

        {showEmptyState ? (
          <p className="text-sm text-slate-600">
            No stories yet. Try adding more feeds or adjust the keyword list.
          </p>
        ) : null}

        {articles.length > 0 ? (
          <ul className="space-y-4">
            {articles.map((article) => (
              <li key={article.id}>
                <ArticleCard article={article} />
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
}
