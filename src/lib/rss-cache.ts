import Redis from "ioredis";

type FetchResult = {
  xml: string;
  headers: Headers;
};

type Fetcher = () => Promise<FetchResult>;

const DEFAULT_TTL_SECONDS = 5 * 60;

let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  if (redisClient) {
    return redisClient;
  }

  const url = process.env.REDIS_URL;
  if (!url) {
    return null;
  }

  redisClient = new Redis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });

  redisClient.on("error", (error) => {
    console.warn("Redis connection error", error);
  });

  return redisClient;
}

async function ensureConnected(client: Redis): Promise<void> {
  if (
    client.status === "ready" ||
    client.status === "connecting" ||
    client.status === "connect" ||
    client.status === "reconnecting"
  ) {
    return;
  }
  await client.connect().catch((error) => {
    console.warn("Failed to connect to Redis", error);
  });
}

function resolveTtlSeconds(): number {
  const value = Number(
    process.env.RSS_CACHE_TTL_SECONDS ?? process.env.RSS_CACHE_TTL ?? "",
  );
  if (Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  return DEFAULT_TTL_SECONDS;
}

async function readFromCache(
  client: Redis,
  key: string,
): Promise<FetchResult | null> {
  try {
    const cached = await client.getBuffer(key);
    if (!cached) {
      return null;
    }

    const payload = JSON.parse(cached.toString("utf-8")) as {
      xml: string;
      headers: [string, string][];
    };
    const headers = new Headers(payload.headers);
    return { xml: payload.xml, headers };
  } catch (error) {
    console.warn("Failed to read RSS cache", { key, error });
    return null;
  }
}

async function writeToCache(
  client: Redis,
  key: string,
  value: FetchResult,
  ttlSeconds: number,
): Promise<void> {
  try {
    const payload = JSON.stringify({
      xml: value.xml,
      headers: Array.from(value.headers.entries()),
    });
    await client.set(key, payload, "EX", ttlSeconds);
  } catch (error) {
    console.warn("Failed to write RSS cache", { key, error });
  }
}

export async function fetchAndCacheFeed(
  feedUrl: string,
  fetcher: Fetcher,
): Promise<FetchResult> {
  const client = getRedisClient();
  const cacheKey = `rss-cache:${feedUrl}`;
  const ttlSeconds = resolveTtlSeconds();

  if (!client) {
    return fetcher();
  }

  await ensureConnected(client);

  const cached = await readFromCache(client, cacheKey);
  if (cached) {
    return cached;
  }

  const result = await fetcher();
  void writeToCache(client, cacheKey, result, ttlSeconds);
  return result;
}
