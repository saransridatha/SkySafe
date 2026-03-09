type WindowState = {
  count: number;
  resetAt: number;
};

const store = new Map<string, WindowState>();

export function checkRateLimit(key: string, maxPerMinute: number): boolean {
  const now = Date.now();
  const current = store.get(key);

  if (!current || now > current.resetAt) {
    store.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (current.count >= maxPerMinute) {
    return false;
  }

  current.count += 1;
  return true;
}
