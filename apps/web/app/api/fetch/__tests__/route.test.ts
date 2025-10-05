import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { loadFeed, type NormalizedFeedItem } from "@services/api/rss";
import { summarize } from "@shared/summarize";

import { POST } from "../route";

vi.mock("@services/api/rss", () => ({
  loadFeed: vi.fn(),
}));

vi.mock("@shared/summarize", () => ({
  summarize: vi.fn(async (_text: string, hint?: string) => `summary:${hint ?? ""}`),
}));

describe("POST /api/fetch", () => {
  beforeEach(() => {
    vi.mocked(loadFeed).mockReset();
    vi.mocked(summarize).mockClear();
  });

  it("aggregates feeds, filters by query, and surfaces warnings", async () => {
    vi.mocked(loadFeed).mockImplementation(async (feedUrl: string): Promise<NormalizedFeedItem[]> => {
      if (feedUrl.includes("one")) {
        return [
          {
            title: "AI breakthrough announced",
            link: "https://source-one.test/story/1",
            source: "source-one.test",
            pubDate: "2024-05-01T10:00:00.000Z",
            contentSnippet: "AI breakthrough announced",
            content: "Detailed article about an AI breakthrough.",
            feedUrl,
          },
          {
            title: "AI breakthrough announced",
            link: "https://source-one.test/story/duplicate",
            source: "source-one.test",
            pubDate: "2024-05-01T10:05:00.000Z",
            contentSnippet: "Duplicate story",
            content: "Duplicate story",
            feedUrl,
          },
          {
            title: "Economy update",
            link: "https://source-one.test/story/2",
            source: "source-one.test",
            pubDate: "2024-05-01T09:00:00.000Z",
            contentSnippet: "Economic news",
            content: "Economic news",
            feedUrl,
          },
        ];
      }

      throw new Error("Feed unreachable");
    });

    const request = {
      json: async () => ({ feeds: ["https://feed-one.test/rss", "https://feed-two.test/rss"], query: "ai" }),
    } as unknown as NextRequest;

    const response = await POST(request);
    const body = (await response.json()) as { items: Array<Record<string, unknown>>; warnings?: string[] };

    expect(response.status).toBe(200);
    expect(body.items).toHaveLength(1);
    expect(body.items[0]).toMatchObject({
      title: "AI breakthrough announced",
      source: "source-one.test",
      summary: "summary:AI breakthrough announced",
    });
    expect(body.warnings).toEqual(["https://feed-two.test/rss: Feed unreachable"]);
    expect(loadFeed).toHaveBeenCalledTimes(2);
  });

  it("limits the number of feeds processed and emits a warning", async () => {
    vi.mocked(loadFeed).mockResolvedValue([]);

    const feeds = Array.from({ length: 17 }, (_, index) => `https://feed-${index + 1}.test/rss`);

    const request = {
      json: async () => ({ feeds, query: "" }),
    } as unknown as NextRequest;

    const response = await POST(request);
    const body = (await response.json()) as { warnings?: string[] };

    expect(response.status).toBe(200);
    expect(loadFeed).toHaveBeenCalledTimes(15);
    expect(body.warnings).toContain("Only the first 15 feeds were processed. Add fewer URLs or create another view.");
  });

  it("handles invalid payloads", async () => {
    const request = {
      json: async () => ({}),
    } as unknown as NextRequest;

    const response = await POST(request);
    const body = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);
    expect(body.error).toBe("feeds array is required");
    expect(loadFeed).not.toHaveBeenCalled();
  });
});
