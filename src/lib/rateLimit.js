import { LRUCache } from 'lru-cache';

export function rateLimit(options) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000, // default 1 minute
  });

  return {
    check: (limit, token) =>
      new Promise((resolve, reject) => {
        const tokenCount = tokenCache.get(token) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage > limit;

        if (isRateLimited) {
          return reject(new Error('Rate limit exceeded'));
        }

        return resolve({
          limit,
          currentUsage,
          remaining: Math.max(0, limit - currentUsage),
        });
      }),
  };
}
