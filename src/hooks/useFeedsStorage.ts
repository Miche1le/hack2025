import { useCallback } from "react";

const DEFAULT_FEED = "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml";
const SAVED_FEEDS_KEY = "userFeeds";

export const useFeedsStorage = () => {
  // Функции для работы с localStorage
  const getSavedFeeds = useCallback((): string => {
    if (typeof window === "undefined") return DEFAULT_FEED;
    return localStorage.getItem(SAVED_FEEDS_KEY) || DEFAULT_FEED;
  }, []);

  const saveFeeds = useCallback((feeds: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(SAVED_FEEDS_KEY, feeds);
  }, []);

  const resetToDefaultFeeds = useCallback((): string => {
    if (typeof window === "undefined") return DEFAULT_FEED;
    localStorage.removeItem(SAVED_FEEDS_KEY);
    return DEFAULT_FEED;
  }, []);

  return {
    getSavedFeeds,
    saveFeeds,
    resetToDefaultFeeds,
    DEFAULT_FEED,
  };
};
