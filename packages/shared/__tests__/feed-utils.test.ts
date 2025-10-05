import test from "node:test";
import assert from "node:assert/strict";

import { createDedupKey, dedupeItems, extractHostname, filterItemsByQuery } from "../feed-utils";
import type { AggregatedItemInput } from "../types";

test("extractHostname trims and lowercases input", () => {
  const value = extractHostname("  HTTPS://Blog.EXAMPLE.com/post ");
  assert.equal(value, "blog.example.com");
});

test("extractHostname accepts bare domains", () => {
  const value = extractHostname("Example.com");
  assert.equal(value, "example.com");
});

test("extractHostname returns empty string for invalid input", () => {
  assert.equal(extractHostname("not a url"), "");
  assert.equal(extractHostname(""), "");
  assert.equal(extractHostname(undefined), "");
});

test("createDedupKey falls back to link hostname when source missing", () => {
  const key = createDedupKey("Sample", "", "https://example.com/article");
  assert.equal(key, "sample::example.com");
});

test("dedupeItems removes duplicates regardless of source casing", () => {
  const base: AggregatedItemInput = {
    title: "OpenAI launches a new service",
    link: "https://example.com/news/1",
    source: "example.com",
    contentSnippet: "The company introduced a new platform.",
    content: "The company introduced a new platform.",
  };

  const duplicate = { ...base, source: "EXAMPLE.com", link: "https://example.com/news/1-copy" };
  const items = dedupeItems([base, duplicate]);

  assert.equal(items.length, 1);
  assert.equal(items[0].link, base.link);
});

test("dedupeItems uses link hostname when source is empty", () => {
  const first: AggregatedItemInput = {
    title: "SpaceX prepares for launch",
    link: "https://spacex.com/launch",
    source: "",
  };
  const second: AggregatedItemInput = {
    title: "spacex prepares for launch!!!",
    link: "https://spacex.com/launch?ref=dup",
    source: "",
  };

  const items = dedupeItems([first, second]);
  assert.equal(items.length, 1);
});

test("filterItemsByQuery keeps entries containing provided terms", () => {
  const entries: AggregatedItemInput[] = [
    { title: "AI helps analyse data", source: "example.com", contentSnippet: "The algorithm saves time" },
    { title: "European economy grows", source: "world.example", contentSnippet: "Markets show growth" },
  ];

  const filtered = filterItemsByQuery(entries, ["Ai", "space"]);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].title, entries[0].title);
});

