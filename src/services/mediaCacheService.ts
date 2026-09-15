import { useEffect, useState } from 'react';

const CACHE_NAME = 'nexus-media-cache-v2';
const MAX_MEMORY_BLOBS = 100;

// In-memory cache for ultra-fast instant synchronous lookups
const memoryCache = new Map<string, string>();
const inFlightRequests = new Map<string, Promise<string>>();

/**
 * Checks if the Cache API is available in the current runtime
 */
function isCacheApiAvailable(): boolean {
  return typeof window !== 'undefined' && 'caches' in window;
}

/**
 * Safely creates an object URL and keeps track of LRU memory size
 */
function createAndStoreBlobUrl(url: string, blob: Blob): string {
  if (memoryCache.size >= MAX_MEMORY_BLOBS) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) {
      const oldBlobUrl = memoryCache.get(firstKey);
      if (oldBlobUrl && oldBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(oldBlobUrl);
      }
      memoryCache.delete(firstKey);
    }
  }
  const blobUrl = URL.createObjectURL(blob);
  memoryCache.set(url, blobUrl);
  return blobUrl;
}

/**
 * Retrieves a cached media URL (as a local Blob URL), or fetches and caches it.
 */
export async function getCachedMediaUrl(url: string): Promise<string> {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }

  // 1. In-memory immediate return
  if (memoryCache.has(url)) {
    return memoryCache.get(url)!;
  }

  // Deduplicate concurrent in-flight requests for the same media URL
  if (inFlightRequests.has(url)) {
    return inFlightRequests.get(url)!;
  }

  const fetchPromise = (async () => {
    try {
      if (isCacheApiAvailable()) {
        const cache = await window.caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(url);

        if (cachedResponse) {
          const blob = await cachedResponse.blob();
          return createAndStoreBlobUrl(url, blob);
        }

        // Not in cache, fetch and store
        try {
          const response = await fetch(url, { mode: 'cors' });
          if (response.ok || response.status === 206) {
            // Put clone into Cache API
            await cache.put(url, response.clone());
            const blob = await response.blob();
            return createAndStoreBlobUrl(url, blob);
          }
        } catch (fetchErr) {
          // If network fetch fails, return original url as fallback
          console.warn('[mediaCache] Failed to fetch and cache media, fallback to direct url:', fetchErr);
          return url;
        }
      }
    } catch (e) {
      console.warn('[mediaCache] Error in cache lookup/storage:', e);
    }

    return url;
  })().finally(() => {
    inFlightRequests.delete(url);
  });

  inFlightRequests.set(url, fetchPromise);
  return fetchPromise;
}

/**
 * Proactively prefetches and caches media (images, audio, video) in the background
 */
export async function prefetchMedia(url: string): Promise<void> {
  if (!url || url.startsWith('blob:') || url.startsWith('data:')) return;
  if (memoryCache.has(url)) return;

  try {
    if (isCacheApiAvailable()) {
      const cache = await window.caches.open(CACHE_NAME);
      const match = await cache.match(url);
      if (!match) {
        const res = await fetch(url, { mode: 'cors' });
        if (res.ok || res.status === 206) {
          await cache.put(url, res);
        }
      }
    }
  } catch (err) {
    // Non-blocking prefetch error
  }
}

/**
 * Prefetches all media from a list of statuses (images, videos, avatars)
 */
export async function prefetchStatusMedia(statuses: any[]): Promise<void> {
  if (!statuses || !Array.isArray(statuses) || statuses.length === 0) return;

  const urlsToPrefetch: string[] = [];
  statuses.forEach((s) => {
    if (s.url && typeof s.url === 'string') {
      urlsToPrefetch.push(s.url);
    }
    if (s.userAvatar && typeof s.userAvatar === 'string' && !s.userAvatar.includes('dicebear')) {
      urlsToPrefetch.push(s.userAvatar);
    }
  });

  // Prefetch with concurrency limit
  const concurrency = 3;
  for (let i = 0; i < urlsToPrefetch.length; i += concurrency) {
    const chunk = urlsToPrefetch.slice(i, i + concurrency);
    await Promise.allSettled(chunk.map((u) => prefetchMedia(u)));
  }
}

/**
 * Clears the persistent media cache and revokes all active blob URLs
 */
export async function clearMediaCache(): Promise<boolean> {
  try {
    memoryCache.forEach((blobUrl) => {
      if (blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    });
    memoryCache.clear();

    if (isCacheApiAvailable()) {
      return await window.caches.delete(CACHE_NAME);
    }
    return true;
  } catch (e) {
    console.error('[mediaCache] Error clearing cache:', e);
    return false;
  }
}

/**
 * React hook for consuming cached media seamlessly with loading & fallback
 */
export function useCachedMedia(mediaUrl: string | undefined | null) {
  const [cachedUrl, setCachedUrl] = useState<string>(() => {
    if (!mediaUrl) return '';
    if (memoryCache.has(mediaUrl)) return memoryCache.get(mediaUrl)!;
    return mediaUrl;
  });
  const [isCached, setIsCached] = useState<boolean>(() => {
    return !!mediaUrl && memoryCache.has(mediaUrl);
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;
    if (!mediaUrl) {
      setCachedUrl('');
      setIsCached(false);
      return;
    }

    if (memoryCache.has(mediaUrl)) {
      setCachedUrl(memoryCache.get(mediaUrl)!);
      setIsCached(true);
      return;
    }

    setIsLoading(true);
    getCachedMediaUrl(mediaUrl)
      .then((resolved) => {
        if (!isCancelled) {
          setCachedUrl(resolved);
          setIsCached(resolved.startsWith('blob:') || memoryCache.has(mediaUrl));
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setCachedUrl(mediaUrl);
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [mediaUrl]);

  return { cachedUrl: cachedUrl || mediaUrl || '', isCached, isLoading };
}
