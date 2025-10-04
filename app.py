from __future__ import annotations

import textwrap
import time
from dataclasses import dataclass
from datetime import timezone
from email.utils import parsedate_to_datetime
from typing import Dict, Iterable, List, Optional

import feedparser
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)


@dataclass
class Source:
    key: str
    name: str
    url: str


SOURCES: Dict[str, Source] = {
    "bbc": Source(
        key="bbc",
        name="BBC World",
        url="http://feeds.bbci.co.uk/news/world/rss.xml",
    ),
    "nytimes": Source(
        key="nytimes",
        name="The New York Times",
        url="https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    ),
    "meduza": Source(
        key="meduza",
        name="Meduza",
        url="https://meduza.io/rss/en/all",
    ),
    "reuters": Source(
        key="reuters",
        name="Reuters World News",
        url="http://feeds.reuters.com/Reuters/worldNews",
    ),
}

CACHE_TTL_SECONDS = 600
_cache: Dict[str, Dict[str, object]] = {}


def summarize(text: str, sentences: int = 2) -> str:
    """Return a compact summary of the text consisting of the first sentences."""
    if not text:
        return ""
    text = text.replace("\n", " ").strip()
    parts: List[str] = []
    sentence_endings = ".!?"
    current = []
    for char in text:
        current.append(char)
        if char in sentence_endings:
            parts.append("".join(current).strip())
            current = []
        if len(parts) >= sentences:
            break
    if len(parts) < sentences and current:
        parts.append("".join(current).strip())
    summary = " ".join(parts)
    return summary or textwrap.shorten(text, width=240, placeholder="…")


def fetch_feed(source: Source) -> List[dict]:
    now = time.time()
    cached = _cache.get(source.key)
    if cached and now - cached["timestamp"] < CACHE_TTL_SECONDS:
        return cached["items"]  # type: ignore[return-value]

    parsed = feedparser.parse(source.url)
    items: List[dict] = []
    for entry in parsed.entries[:20]:
        summary = entry.get("summary") or entry.get("description") or ""
        summary_text = summarize(summary)
        published_raw = entry.get("published") or entry.get("updated") or ""
        published_iso = ""
        timestamp = 0.0
        if published_raw:
            try:
                dt = parsedate_to_datetime(published_raw)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                published_iso = dt.isoformat()
                timestamp = dt.timestamp()
            except Exception:
                pass
        items.append(
            {
                "title": entry.get("title", "Untitled"),
                "summary": summary_text,
                "link": entry.get("link", ""),
                "published": published_iso or published_raw,
                "timestamp": timestamp,
                "source": source.name,
            }
        )

    _cache[source.key] = {"timestamp": now, "items": items}
    return items


def resolve_sources(requested: Optional[Iterable[str]]) -> List[Source]:
    if not requested:
        return list(SOURCES.values())
    resolved = []
    for key in requested:
        if key in SOURCES:
            resolved.append(SOURCES[key])
    return resolved or list(SOURCES.values())


@app.get("/")
def index():
    return render_template("index.html", sources=SOURCES.values())


@app.get("/api/news")
def news_api():
    requested_sources = request.args.get("sources")
    source_keys = [s.strip() for s in requested_sources.split(",") if s.strip()] if requested_sources else None
    sources = resolve_sources(source_keys)

    keyword = request.args.get("q", "").lower()
    limit = min(int(request.args.get("limit", 20)), 50)

    all_items: List[dict] = []
    for source in sources:
        all_items.extend(fetch_feed(source))

    if keyword:
        keywords = [k.strip() for k in keyword.split() if k.strip()]
        if keywords:
            filtered = []
            for item in all_items:
                haystack = f"{item['title']} {item['summary']}".lower()
                if all(word in haystack for word in keywords):
                    filtered.append(item)
            all_items = filtered

    all_items.sort(key=lambda x: x.get("timestamp", 0.0), reverse=True)
    return jsonify({"items": all_items[:limit]})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
