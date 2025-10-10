"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArticleCard } from "@/components/ArticleCard";
import { Onboarding } from "@/components/Onboarding";
import type { Article } from "@/types";
import { useFeedsStorage } from "@/hooks/useFeedsStorage";

const EMPTY_FEED_ERROR = "Добавьте хотя бы одну RSS-ленту.";
const GENERIC_FETCH_ERROR = "Не удалось обновить ленты. Попробуйте еще раз.";
const MAX_FEEDS = 15;

const parseFeeds = (input: string): string[] =>
  input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, MAX_FEEDS);

async function fetchArticles(
  feeds: string[],
  query: string,
): Promise<{
  articles: Article[];
  warnings: string[];
  error?: string;
}> {
  const response = await fetch("/api/fetch", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ feeds, query }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(payload.error ?? GENERIC_FETCH_ERROR);
  }

  const payload = (await response.json()) as {
    articles?: Article[];
    warnings?: string[];
    error?: string;
  };

  if (payload.error) {
    throw new Error(payload.error);
  }

  return {
    articles: payload.articles ?? [],
    warnings: payload.warnings ?? [],
  };
}

export default function HomePage() {
  const { getSavedFeeds, saveFeeds, resetToDefaultFeeds, DEFAULT_FEED } = useFeedsStorage();
  
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [feedsInput, setFeedsInput] = useState(() => getSavedFeeds());
  const [query, setQuery] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [readArticles, setReadArticles] = useState<Set<string>>(new Set());
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "favorites">("all");
  const [showSettings, setShowSettings] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if first visit
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setShowOnboarding(false);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Блокировка прокрутки при открытом мобильном меню
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const lastUpdatedLabel = useMemo(
    () =>
      lastUpdated
        ? lastUpdated.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : null,
    [lastUpdated],
  );

  const warningsLabel = useMemo(() => {
    if (warnings.length === 0) {
      return null;
    }
    return warnings.length === 1
      ? "One feed could not be loaded:"
      : `${warnings.length} feeds could not be loaded:`;
  }, [warnings]);

  const abortRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<{ feeds: string[]; query: string } | null>(
    null,
  );
  const didInitialFetchRef = useRef(false);

  const toggleFavorite = useCallback((articleId: string) => {
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
      }
      return newSet;
    });
  }, []);

  const markAsRead = useCallback((articleId: string) => {
    setReadArticles((prev) => new Set(prev).add(articleId));
  }, []);

  const displayedArticles = useMemo(() => {
    if (activeTab === "favorites") {
      return articles.filter((article) => favorites.has(article.id));
    }
    return articles;
  }, [articles, favorites, activeTab]);

  // Smart recommendations based on favorites and reading history
  const [recommendedArticles, setRecommendedArticles] = useState<Article[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Update recommendations when favorites or articles change
  useEffect(() => {
    async function updateRecommendations() {
      if (favorites.size === 0 || articles.length === 0) {
        // No favorites yet - show most recent unread articles
        const fallback = articles
          .filter((article) => !readArticles.has(article.id))
          .slice(0, 5);
        setRecommendedArticles(fallback);
        return;
      }

      setLoadingRecommendations(true);

      try {
        // Get semantic recommendations from API
        const favoriteIds = Array.from(favorites);
        const candidateIds = articles
          .filter(
            (article) =>
              !favorites.has(article.id) && !readArticles.has(article.id),
          )
          .map((article) => article.id);

        const response = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            favoriteIds,
            candidateIds,
            articles,
            topK: 5,
          }),
        });

        if (response.ok) {
          const data = (await response.json()) as {
            recommendations: Article[];
          };
          setRecommendedArticles(data.recommendations || []);
        } else {
          // Fallback to keyword-based
          const favoriteArticles = articles.filter((article) =>
            favorites.has(article.id),
          );
          const candidateArticles = articles.filter(
            (article) =>
              !favorites.has(article.id) && !readArticles.has(article.id),
          );

          const favoriteKeywords = favoriteArticles
            .flatMap((article) => {
              const text =
                `${article.title} ${article.summary || ""}`.toLowerCase();
              return text.split(/\W+/).filter((word) => word.length > 4);
            })
            .reduce(
              (acc, word) => {
                acc[word] = (acc[word] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>,
            );

          const scoredArticles = candidateArticles
            .map((article) => {
              const text =
                `${article.title} ${article.summary || ""}`.toLowerCase();
              const words = text.split(/\W+/);
              const score = words.reduce(
                (sum, word) => sum + (favoriteKeywords[word] || 0),
                0,
              );
              return { article, score };
            })
            .filter(({ score }) => score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(({ article }) => article);

          setRecommendedArticles(
            scoredArticles.length > 0
              ? scoredArticles
              : candidateArticles.slice(0, 5),
          );
        }
      } catch (error) {
        console.error("Failed to get recommendations:", error);
        // Fallback to recent articles
        const fallback = articles
          .filter(
            (article) =>
              !favorites.has(article.id) && !readArticles.has(article.id),
          )
          .slice(0, 5);
        setRecommendedArticles(fallback);
      } finally {
        setLoadingRecommendations(false);
      }
    }

    void updateRecommendations();
  }, [articles, favorites, readArticles]);

  const performFetch = useCallback(
    async (
      feeds: string[],
      currentQuery: string,
      reason: "manual" | "auto" | "initial",
    ) => {
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
        const { articles: fetchedArticles, warnings: fetchWarnings } =
          await fetchArticles(feeds, currentQuery);
        if (controller.signal.aborted) {
          return;
        }

        setArticles(fetchedArticles);
        setWarnings(fetchWarnings);
        setError(null);
        setLastUpdated(new Date());
      } catch (fetchError) {
        if (
          fetchError instanceof DOMException &&
          fetchError.name === "AbortError"
        ) {
          return;
        }
        const message =
          fetchError instanceof Error && fetchError.message
            ? fetchError.message
            : GENERIC_FETCH_ERROR;
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

      // Сохраняем ленты в localStorage
      saveFeeds(feedsInput);

      lastRequestRef.current =
        feeds.length === 0 ? null : { feeds, query: normalizedQuery };
      await performFetch(feeds, normalizedQuery, "manual");
      setShowSettings(false);
    },
    [feedsInput, query, performFetch],
  );

  useEffect(() => {
    if (didInitialFetchRef.current) {
      return;
    }
    didInitialFetchRef.current = true;

    const feeds = parseFeeds(feedsInput);
    lastRequestRef.current = { feeds, query: "" };
    void performFetch(feeds, "", "initial");
  }, [performFetch, feedsInput]);

  const handleResetFeeds = useCallback(() => {
    const defaultFeeds = resetToDefaultFeeds();
    setFeedsInput(defaultFeeds);
    const feeds = parseFeeds(defaultFeeds);
    lastRequestRef.current = { feeds, query: "" };
    void performFetch(feeds, "", "manual");
  }, [performFetch]);

  const showEmptyState =
    hasFetched && !loading && !error && displayedArticles.length === 0;

  return (
    <>
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}

      <div className="min-h-screen" style={{ background: "var(--background)" }}>
        {/* Awwwards-style Navigation */}
        <nav
          className="fixed top-0 left-0 right-0 z-50 backdrop-blur-nav"
          style={{
            background: "var(--nav-bg)",
            borderBottom: `1px solid var(--card-border)`,
          }}
        >
          <div className="mx-auto max-w-[1600px] px-4 md:px-8">
            <div className="flex h-16 items-center justify-between">
              {/* Logo и Desktop Navigation */}
              <div className="flex items-center md:gap-12 gap-4">
                <span
                  className="text-2xl font-bold tracking-tight"
                  style={{ color: "var(--text-primary)" }}
                >
                  N.
                </span>
                {/* Desktop menu */}
                <div className="hidden md:flex items-center gap-8">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`text-sm font-medium transition ${activeTab === "all" ? "opacity-100" : "opacity-40 hover:opacity-100"}`}
                    style={{ color: "var(--text-primary)" }}
                  >
                    Последние
                  </button>
                  <button
                    onClick={() => setActiveTab("favorites")}
                    className={`text-sm font-medium transition ${activeTab === "favorites" ? "opacity-100" : "opacity-40 hover:opacity-100"}`}
                    style={{ color: "var(--text-primary)" }}
                  >
                    Избранное
                  </button>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-sm font-medium opacity-40 hover:opacity-100 transition"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Настройки
                  </button>
                </div>
              </div>

              {/* Desktop Actions */}
              <div className="hidden md:flex items-center gap-4">
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 text-sm font-medium opacity-40 hover:opacity-100 transition"
                  style={{ color: "var(--text-primary)" }}
                >
                  {theme === "light" ? (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                        />
                      </svg>
                      <span>Темная</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      <span>Светлая</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() =>
                    void performFetch(
                      parseFeeds(feedsInput),
                      query.trim(),
                      "manual",
                    )
                  }
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 text-sm font-medium transition hover:opacity-80 disabled:opacity-50"
                  style={{
                    background: "var(--accent)",
                    color: "var(--background)",
                    border: "1px solid var(--card-border)",
                  }}
                >
                  {loading ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Обновление</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      <span>Обновить</span>
                    </>
                  )}
                </button>
              </div>

              {/* Mobile Actions */}
              <div className="flex md:hidden items-center gap-3">
                <button
                  onClick={() =>
                    void performFetch(
                      parseFeeds(feedsInput),
                      query.trim(),
                      "manual",
                    )
                  }
                  disabled={loading}
                  className="flex items-center justify-center w-10 h-10 text-sm font-medium transition hover:opacity-80 disabled:opacity-50"
                  style={{
                    background: "var(--accent)",
                    color: "var(--background)",
                    border: "1px solid var(--card-border)",
                  }}
                >
                  {loading ? (
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  )}
                </button>
                
                {/* Burger Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="flex items-center justify-center w-10 h-10 transition hover:opacity-80"
                  style={{ color: "var(--text-primary)" }}
                  aria-label="Меню"
                >
                  {mobileMenuOpen ? (
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Menu Sidebar */}
        <div
          className={`fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw] transform transition-transform duration-300 ease-in-out md:hidden ${
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
          style={{
            background: "var(--background)",
            borderLeft: `1px solid var(--card-border)`,
          }}
        >
          <div className="flex flex-col h-full">
            {/* Mobile Menu Header */}
            <div
              className="flex items-center justify-between p-6 border-b"
              style={{ borderColor: "var(--card-border)" }}
            >
              <span
                className="text-xl font-bold tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Меню
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center w-10 h-10 transition hover:opacity-80"
                style={{ color: "var(--text-primary)" }}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Mobile Menu Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <nav className="space-y-1">
                <button
                  onClick={() => {
                    setActiveTab("all");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg text-base font-medium transition ${
                    activeTab === "all"
                      ? "opacity-100"
                      : "opacity-60 hover:opacity-100"
                  }`}
                  style={{
                    background:
                      activeTab === "all" ? "var(--surface)" : "transparent",
                    color: "var(--text-primary)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                      />
                    </svg>
                    <span>Последние новости</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("favorites");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg text-base font-medium transition ${
                    activeTab === "favorites"
                      ? "opacity-100"
                      : "opacity-60 hover:opacity-100"
                  }`}
                  style={{
                    background:
                      activeTab === "favorites"
                        ? "var(--surface)"
                        : "transparent",
                    color: "var(--text-primary)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span>Избранное</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowSettings(!showSettings);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg text-base font-medium opacity-60 hover:opacity-100 transition"
                  style={{ color: "var(--text-primary)" }}
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>Настройки</span>
                  </div>
                </button>

                <div className="my-4 border-t" style={{ borderColor: "var(--card-border)" }} />

                <button
                  onClick={() => {
                    toggleTheme();
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg text-base font-medium opacity-60 hover:opacity-100 transition"
                  style={{ color: "var(--text-primary)" }}
                >
                  <div className="flex items-center gap-3">
                    {theme === "light" ? (
                      <>
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                          />
                        </svg>
                        <span>Темная тема</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                        <span>Светлая тема</span>
                      </>
                    )}
                  </div>
                </button>
              </nav>

              {/* Mobile Menu Stats */}
              <div className="mt-8 p-4 rounded-lg" style={{ background: "var(--surface)" }}>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between" style={{ color: "var(--text-secondary)" }}>
                    <span>Всего статей</span>
                    <span style={{ color: "var(--text-primary)" }} className="font-medium">
                      {articles.length}
                    </span>
                  </div>
                  <div className="flex justify-between" style={{ color: "var(--text-secondary)" }}>
                    <span>Избранных</span>
                    <span style={{ color: "var(--text-primary)" }} className="font-medium">
                      {favorites.size}
                    </span>
                  </div>
                  {lastUpdatedLabel && (
                    <div className="flex justify-between" style={{ color: "var(--text-secondary)" }}>
                      <span>Обновлено</span>
                      <span style={{ color: "var(--text-primary)" }} className="font-medium">
                        {lastUpdatedLabel}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div
            className="border-b mt-12"
            style={{
              borderColor: "var(--card-border)",
              background: "var(--surface)",
            }}
          >
            <div className="mx-auto max-w-7xl px-6 py-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="feeds"
                      className="mb-2 block text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      RSS-ленты
                    </label>
                    <textarea
                      id="feeds"
                      value={feedsInput}
                      onChange={(e) => setFeedsInput(e.target.value)}
                      rows={4}
                      className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2"
                      style={
                        {
                          background: "var(--card-bg)",
                          borderColor: "var(--card-border)",
                          color: "var(--text-primary)",
                          "--tw-ring-color": "var(--accent)",
                        } as React.CSSProperties
                      }
                      placeholder="https://example.com/feed.xml"
                    />
                    <p
                      className="mt-1.5 text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Одна ссылка на строку. Максимум {MAX_FEEDS} лент.
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="query"
                      className="mb-2 block text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Ключевые слова
                    </label>
                    <input
                      id="query"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2"
                      style={
                        {
                          background: "var(--card-bg)",
                          borderColor: "var(--card-border)",
                          color: "var(--text-primary)",
                          "--tw-ring-color": "var(--accent)",
                        } as React.CSSProperties
                      }
                      placeholder="ИИ, технологии, наука..."
                    />
                    <p
                      className="mt-1.5 text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Ключевые слова через запятую. Оставьте пустым, чтобы
                      показать все статьи.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-sm font-medium hover:opacity-90 transition"
                    style={{
                      background: "var(--accent)",
                      color: "var(--background)",
                      border: "1px solid var(--card-border)",
                    }}
                  >
                    Применить изменения
                  </button>
                  <button
                    type="button"
                    onClick={handleResetFeeds}
                    className="px-5 py-2.5 text-sm font-medium hover:opacity-90 transition"
                    style={{
                      background: "var(--surface)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--card-border)",
                    }}
                  >
                    Сбросить к стандартным
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <main className="mx-auto max-w-[1600px] px-8 pt-24 pb-20">
          {/* Header */}
          <div
            className="mb-12 flex items-center justify-between border-b pb-6"
            style={{ borderColor: "var(--card-border)" }}
          >
            <div>
              <h1
                className="text-4xl md:text-5xl font-bold tracking-tight mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                {activeTab === "all" ? "Последние новости" : "Избранное"}
              </h1>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {activeTab === "all"
                  ? `${articles.length} статей из ваших лент`
                  : `${favorites.size} сохраненных статей`}
                {lastUpdatedLabel && ` · Обновлено ${lastUpdatedLabel}`}
              </p>
            </div>
          </div>

          <div className="grid gap-12 lg:grid-cols-12">
            {/* Main Content */}
            <div className="lg:col-span-8">
              {/* Alerts */}
              {error && (
                <div
                  className="mb-5 rounded-2xl border p-5"
                  style={{
                    borderColor: "#ff3b30",
                    background: theme === "light" ? "#fff5f5" : "#2d1f1f",
                    color: "#ff3b30",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <svg
                      className="h-5 w-5 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              {warnings.length > 0 && (
                <div
                  className="mb-5 rounded-2xl border p-5"
                  style={{
                    borderColor: "#ff9500",
                    background: theme === "light" ? "#fff9f0" : "#2d2619",
                    color: "#ff9500",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <svg
                      className="h-5 w-5 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold">{warningsLabel}</p>
                      <ul className="mt-2 space-y-1 text-sm opacity-80">
                        {warnings.map((warning) => (
                          <li key={warning}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div
                      className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"
                      style={{
                        borderColor: "var(--accent)",
                        borderTopColor: "transparent",
                      }}
                    ></div>
                    <p
                      className="mt-4 text-sm font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Загрузка статей...
                    </p>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {showEmptyState && (
                <div
                  className="rounded-2xl py-16 text-center"
                  style={{ background: "var(--surface)" }}
                >
                  <svg
                    className="mx-auto h-16 w-16 opacity-30"
                    style={{ color: "var(--text-secondary)" }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    />
                  </svg>
                  <p
                    className="mt-4 text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {activeTab === "favorites"
                      ? "Нет избранных статей"
                      : "Статьи не найдены"}
                  </p>
                  <p
                    className="mt-1 text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {activeTab === "favorites"
                      ? "Сохраняйте статьи, чтобы увидеть их здесь."
                      : "Попробуйте изменить фильтры или добавить больше лент."}
                  </p>
                </div>
              )}

              {/* Articles */}
              {displayedArticles.length > 0 && (
                <div className="space-y-4">
                  {displayedArticles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      isFavorite={favorites.has(article.id)}
                      isRead={readArticles.has(article.id)}
                      onToggleFavorite={() => toggleFavorite(article.id)}
                      onMarkRead={() => markAsRead(article.id)}
                      theme={theme}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar - Recommendations */}
            <aside className="lg:col-span-4">
              <div className="sticky top-28">
                <div className="mb-6 flex items-center justify-between">
                  <h2
                    className="text-sm font-medium uppercase tracking-wider"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Рекомендации
                  </h2>
                  {loadingRecommendations && (
                    <div
                      className="h-3 w-3 animate-spin rounded-full border border-t-transparent"
                      style={{ borderColor: "var(--text-secondary)" }}
                    ></div>
                  )}
                </div>

                {recommendedArticles.length > 0 ? (
                  <div className="space-y-6">
                    {recommendedArticles.map((article) => (
                      <div key={article.id} className="group">
                        <a
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                          onClick={() => markAsRead(article.id)}
                        >
                          <h3
                            className="mb-2 text-lg font-bold line-clamp-2 transition-opacity group-hover:opacity-60"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {article.title}
                          </h3>
                          <p
                            className="text-xs uppercase tracking-wider"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {article.source}
                          </p>
                        </a>
                      </div>
                    ))}
                  </div>
                ) : loadingRecommendations ? (
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Анализ...
                  </p>
                ) : (
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {favorites.size === 0
                      ? "Сохраняйте статьи, чтобы получать персонализированные рекомендации на основе ИИ."
                      : "Нет доступных рекомендаций."}
                  </p>
                )}
              </div>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}
