"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HorizontalFeed } from "./components/horizontal-feed";
import { FilterControls, type SortOption } from "./components/filter-controls";
import { ThemeToggle } from "./components/theme-toggle";
import type { Article, FetchResponse } from "@shared/types";
import { dedupeItems, filterItemsByQuery } from "@shared/feed-utils";
import { loadFeed } from "@services/api/rss";
import { summarize } from "@shared/summarize";

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
  const [sortBy, setSortBy] = useState<SortOption>('newest');

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

  // Client-side filtering and sorting
  const filteredAndSortedArticles = useMemo(() => {
    let filtered = articles;

    // Apply client-side filtering
    if (query.trim()) {
      const queryTerms = query.trim().toLowerCase().split(/[\s,]+/).filter(Boolean);
      filtered = filterItemsByQuery(articles, queryTerms);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          const timeA = a.pubDate ? Date.parse(a.pubDate) : 0;
          const timeB = b.pubDate ? Date.parse(b.pubDate) : 0;
          return timeB - timeA;
        
        case 'source':
          return (a.source || '').localeCompare(b.source || '');
        
        case 'relevance':
          if (!query.trim()) return 0;
          const queryTerms = query.trim().toLowerCase().split(/[\s,]+/).filter(Boolean);
          const scoreA = queryTerms.reduce((score, term) => {
            const titleMatches = (a.title || '').toLowerCase().includes(term) ? 2 : 0;
            const summaryMatches = (a.summary || '').toLowerCase().includes(term) ? 1 : 0;
            return score + titleMatches + summaryMatches;
          }, 0);
          const scoreB = queryTerms.reduce((score, term) => {
            const titleMatches = (b.title || '').toLowerCase().includes(term) ? 2 : 0;
            const summaryMatches = (b.summary || '').toLowerCase().includes(term) ? 1 : 0;
            return score + titleMatches + summaryMatches;
          }, 0);
          return scoreB - scoreA;
        
        default:
          return 0;
      }
    });

    return sorted;
  }, [articles, query, sortBy]);

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
              const generated = await summarize(safeBase, item.title);
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

  const handleRefresh = useCallback(() => {
    const snapshot = lastRequestRef.current;
    if (snapshot) {
      void performFetch(snapshot.feeds, snapshot.query, "manual");
    }
  }, [performFetch]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
                News Intelligence
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 font-light">
                Effortlessly helpful every day. Stay informed with AI-powered news summaries.
              </p>
            </div>
            <ThemeToggle />
          </div>

          {/* RSS Feeds Input */}
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
              <div className="space-y-6">
                <div>
                  <label htmlFor="feeds" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    RSS Feeds (one per line)
                  </label>
                  <textarea
                    id="feeds"
                    name="feeds"
                    value={feedsInput}
                    onChange={(event) => setFeedsInput(event.target.value)}
                    rows={4}
                    spellCheck={false}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                    placeholder="https://example.com/feed.xml"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Paste up to {MAX_FEEDS} feed URLs. Each line should contain a single address.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </header>

        {/* Filter Controls */}
        <FilterControls
          onFilterChange={setQuery}
          onSortChange={setSortBy}
          onRefreshIntervalChange={setIntervalInput}
          currentQuery={query}
          currentSort={sortBy}
          currentInterval={sanitizedInterval}
          loading={loading}
          onRefresh={handleRefresh}
        />

        {/* Status Messages */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-amber-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {warningsLabel ?? "Feed load warnings:"}
                </h3>
                <ul className="mt-2 text-sm text-amber-700 dark:text-amber-300 list-disc list-inside">
                  {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Last Updated */}
        {lastUpdatedLabel && (
          <div className="mb-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last updated at {lastUpdatedLabel}
            </p>
          </div>
        )}

        {/* Horizontal Feed */}
        <HorizontalFeed articles={filteredAndSortedArticles} loading={loading} />
      </main>
    </div>
  );
}