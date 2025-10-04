"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArticleCard, type Article } from "./components/article-card";

interface FetchResponse {
  articles?: Article[];
  error?: string;
}

const DEFAULT_FEED = "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml";
const EMPTY_FEED_ERROR = "Добавьте хотя бы один RSS-адрес.";
const GENERIC_FETCH_ERROR = "Не удалось обновить ленту. Попробуйте ещё раз позже.";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

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
        setHasFetched(true);
        setLoading(false);
        setError(EMPTY_FEED_ERROR);
        return;
      }

      if (abortRef.current) {
        abortRef.current.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;

      if (reason !== "auto") {
        setError(null);
      }
      setLoading(true);

      try {
        const response = await fetch("/api/fetch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            feeds,
            query: currentQuery,
            interval: sanitizedInterval
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          let message = GENERIC_FETCH_ERROR;
          try {
            const errorPayload = await response.json();
            if (errorPayload && typeof errorPayload.error === "string" && errorPayload.error.trim()) {
              message = errorPayload.error.trim();
            }
          } catch {
            try {
              const fallbackText = (await response.text()).trim();
              if (fallbackText) {
                message = fallbackText;
              }
            } catch {
              // ignore
            }
          }
          throw new Error(message);
        }

        const data: FetchResponse = await response.json();
        const nextArticles = Array.isArray(data.articles) ? data.articles : [];
        setArticles(nextArticles);
        setError(data.error ?? null);
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
    [sanitizedInterval]
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const feeds = parseFeeds(feedsInput);
      const normalizedQuery = query.trim();

      if (feeds.length === 0) {
        lastRequestRef.current = null;
        await performFetch(feeds, normalizedQuery, "manual");
        return;
      }

      lastRequestRef.current = { feeds, query: normalizedQuery };
      await performFetch(feeds, normalizedQuery, "manual");
    },
    [feedsInput, query, performFetch]
  );

  useEffect(() => {
    if (didInitialFetchRef.current) {
      return;
    }
    const feeds = parseFeeds(feedsInput);
    const normalizedQuery = query.trim();
    if (feeds.length === 0) {
      return;
    }
    didInitialFetchRef.current = true;
    lastRequestRef.current = { feeds, query: normalizedQuery };
    void performFetch(feeds, normalizedQuery, "initial");
  }, [feedsInput, query, performFetch]);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (!hasFetched) {
      return;
    }

    const intervalMs = sanitizedInterval * 60 * 1000;
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
        <h1 className="text-3xl font-bold text-slate-900">Персональный агрегатор новостей</h1>
        <p className="mt-2 text-sm text-slate-600">
          Соберите нужные источники в одном месте: добавьте RSS-ленты, укажите ключевые слова и получайте свежие сводки.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="space-y-2">
          <label htmlFor="feeds" className="block text-sm font-semibold text-slate-800">
            RSS-ленты (каждая с новой строки)
          </label>
          <p className="text-xs text-slate-500">Вставляйте по одному URL на строку, чтобы отслеживать сразу несколько источников.</p>
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
              Ключевые слова
            </label>
            <input
              id="query"
              name="query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="технологии, стартапы"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              autoComplete="off"
            />
            <p className="text-xs text-slate-500">Перечислите слова через запятую, чтобы фильтровать материалы по теме.</p>
          </div>

          <div className="w-full max-w-[140px] space-y-2">
            <label htmlFor="interval" className="block text-sm font-semibold text-slate-800">
              Интервал, мин
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
              Автообновление ленты каждые {sanitizedInterval} мин.
            </p>
          </div>
        </div>

        <div>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:bg-blue-400"
            disabled={loading}
          >
            {loading ? "Обновляем..." : "Обновить"}
          </button>
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

        {loading ? (
          <p className="text-sm text-slate-600" role="status">
            Обновляем ленту новостей…
          </p>
        ) : null}

        {showEmptyState ? (
          <p className="text-sm text-slate-600">
            Пока ничего не найдено. Попробуйте добавить больше лент или скорректировать запрос.
          </p>
        ) : null}

        {articles.length > 0 ? (
          <ul className="space-y-4">
            {articles.map((article, index) => (
              <li key={`${article.link ?? "article"}-${index}`}>
                <ArticleCard article={article} />
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
}
