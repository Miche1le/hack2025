"use client";

import { useState } from 'react';

interface Article {
  title?: string;
  link?: string;
  pubDate?: string;
  source?: string;
  summary: string;
}

export default function HomePage() {
  const [feedsInput, setFeedsInput] = useState('https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const feeds = feedsInput
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      const res = await fetch('/api/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feeds, query })
      });
      const data = await res.json();
      if (data.articles) {
        setArticles(data.articles);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">╨Я╨╡╤А╤Б╨╛╨╜╨░╨╗╤М╨╜╤Л╨╣ ╨░╨│╤А╨╡╨│╨░╤В╨╛╤А ╨╜╨╛╨▓╨╛╤Б╤В╨╡╨╣</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-semibold">╨б╤Б╤Л╨╗╨║╨╕ ╨╜╨░ RSS (╨║╨░╨╢╨┤╨░╤П ╤Б ╨╜╨╛╨▓╨╛╨╣ ╤Б╤В╤А╨╛╨║╨╕)</label>
          <textarea
            value={feedsInput}
            onChange={(e) => setFeedsInput(e.target.value)}
            rows={4}
            className="w-full border rounded p-2"
            placeholder="https://example.com/feed.xml"
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold">╨Ъ╨╗╤О╤З╨╡╨▓╤Л╨╡ ╤Б╨╗╨╛╨▓╨░ (╨╛╨┐╤Ж╨╕╨╛╨╜╨░╨╗╤М╨╜╨╛)</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="╤Д╨╕╨╗╤М╤В╤А ╨┐╨╛ ╨║╨╗╤О╤З╨╡╨▓╤Л╨╝ ╤Б╨╗╨╛╨▓╨░╨╝"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? '╨Ч╨░╨│╤А╤Г╨╖╨║╨░...' : '╨Ю╨▒╨╜╨╛╨▓╨╕╤В╤М ╨╗╨╡╨╜╤В╤Г'}
        </button>
      </form>
      <section className="mt-8 space-y-6">
        {articles.map((article, idx) => (
          <div key={idx} className="border rounded p-4 shadow">
            <a href={article.link} target="_blank" rel="noopener noreferrer" className="text-lg font-bold hover:underline">
              {article.title || '╨С╨╡╨╖ ╨╜╨░╨╖╨▓╨░╨╜╨╕╤П'}
            </a>
            <p className="text-sm text-gray-600">
              {article.source} тАв {article.pubDate}
            </p>
            <p className="mt-2">{article.summary}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
