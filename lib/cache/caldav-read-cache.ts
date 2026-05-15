type CacheEntry<T> = {
  value: T;
  freshUntil: number;
  staleUntil: number;
};

export type MemoryCacheResult<T> = {
  value: T;
  cacheState: "fresh" | "stale" | "miss";
};

type ReadThroughCacheOptions = {
  ttlMs?: number;
  staleWhileRevalidateMs?: number;
};

const DEFAULT_TTL_MS = 60_000;
const DEFAULT_STALE_WHILE_REVALIDATE_MS = 30_000;

const cacheEntries = new Map<string, CacheEntry<unknown>>();
const inflightLoads = new Map<string, Promise<unknown>>();

function getCacheTimings(options?: ReadThroughCacheOptions) {
  return {
    ttlMs: options?.ttlMs ?? DEFAULT_TTL_MS,
    staleWhileRevalidateMs:
      options?.staleWhileRevalidateMs ?? DEFAULT_STALE_WHILE_REVALIDATE_MS,
  };
}

function getEntry<T>(key: string) {
  return cacheEntries.get(key) as CacheEntry<T> | undefined;
}

function setEntry<T>(key: string, value: T, options?: ReadThroughCacheOptions) {
  const now = Date.now();
  const timings = getCacheTimings(options);

  const entry: CacheEntry<T> = {
    value,
    freshUntil: now + timings.ttlMs,
    staleUntil: now + timings.ttlMs + timings.staleWhileRevalidateMs,
  };

  cacheEntries.set(key, entry);
  return entry;
}

async function loadAndStoreValue<T>(
  key: string,
  loader: () => Promise<T>,
  options?: ReadThroughCacheOptions,
) {
  const existingLoad = inflightLoads.get(key) as Promise<T> | undefined;

  if (existingLoad) {
    return existingLoad;
  }

  const nextLoad = loader()
    .then((value) => {
      setEntry(key, value, options);
      return value;
    })
    .finally(() => {
      inflightLoads.delete(key);
    });

  inflightLoads.set(key, nextLoad);
  return nextLoad;
}

export async function readThroughMemoryCache<T>(
  key: string,
  loader: () => Promise<T>,
  options?: ReadThroughCacheOptions,
): Promise<MemoryCacheResult<T>> {
  const entry = getEntry<T>(key);
  const now = Date.now();

  if (entry && now < entry.freshUntil) {
    return {
      value: entry.value,
      cacheState: "fresh",
    };
  }

  if (entry && now < entry.staleUntil) {
    void loadAndStoreValue(key, loader, options).catch(() => {
      // Cache intentionally falls back to the stale value. This module is
      // designed for a single Coolify container and can be swapped for Redis later.
    });

    return {
      value: entry.value,
      cacheState: "stale",
    };
  }

  const value = await loadAndStoreValue(key, loader, options);

  return {
    value,
    cacheState: "miss",
  };
}

export function buildCalDavTimeRangeCacheKey(input: {
  calendarHref: string;
  start: string;
  end: string;
  timezone: string;
}) {
  return [
    "caldav-range",
    input.calendarHref,
    input.start,
    input.end,
    input.timezone,
  ]
    .map((value) => encodeURIComponent(value))
    .join("|");
}

export function invalidateCalDavTimeRangeCache(calendarHref: string) {
  const prefix = ["caldav-range", calendarHref]
    .map((value) => encodeURIComponent(value))
    .join("|");

  for (const key of cacheEntries.keys()) {
    if (key.startsWith(`${prefix}|`)) {
      cacheEntries.delete(key);
    }
  }

  for (const key of inflightLoads.keys()) {
    if (key.startsWith(`${prefix}|`)) {
      inflightLoads.delete(key);
    }
  }
}
