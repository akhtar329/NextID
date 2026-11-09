// lib/rate-limit.ts

type RateLimitEntry = {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  lockedUntil: number | null;
  lockoutCount: number;
};

const store = new Map<string, RateLimitEntry>();

// Auto cleanup every 10 min
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (!entry.lockedUntil && now - entry.lastAttempt > 2 * 60 * 60 * 1000) {
        store.delete(key);
      }
      if (entry.lockedUntil && entry.lockedUntil < now) {
        store.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

// ============ CONFIG ============
export const RATE_LIMIT_CONFIG = {
  // ✅ Per-account (email) — route.ts mein RATE_LIMIT_CONFIG.ACCOUNT use hota hai
  ACCOUNT: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    lockoutMs: 15 * 60 * 1000, // 15 minutes
    exponential: true,
  },
  // ✅ Per-IP — route.ts mein RATE_LIMIT_CONFIG.IP use hota hai
  IP: {
    maxAttempts: 20,
    windowMs: 15 * 60 * 1000,
    lockoutMs: 30 * 60 * 1000, // 30 minutes
    exponential: false,
  },
} as const;

// ============ THROTTLE ============
export function getThrottleDelay(attemptCount: number): number {
  if (attemptCount <= 1) return 0;
  if (attemptCount === 2) return 500;
  if (attemptCount === 3) return 1000;
  if (attemptCount === 4) return 2000;
  return 4000;
}

// ============ CHECK ============
export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  lockedUntil: number | null;
  retryAfterSeconds: number;
  attemptCount: number;
};

export function checkRateLimit(
  key: string,
  config: { maxAttempts: number; windowMs: number; lockoutMs: number }
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    return {
      allowed: true,
      remaining: config.maxAttempts,
      lockedUntil: null,
      retryAfterSeconds: 0,
      attemptCount: 0,
    };
  }

  // Currently locked
  if (entry.lockedUntil && entry.lockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      lockedUntil: entry.lockedUntil,
      retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000),
      attemptCount: entry.count,
    };
  }

  // Lock expired → reset
  if (entry.lockedUntil && entry.lockedUntil <= now) {
    store.delete(key);
    return {
      allowed: true,
      remaining: config.maxAttempts,
      lockedUntil: null,
      retryAfterSeconds: 0,
      attemptCount: 0,
    };
  }

  // Window expired → reset
  if (now - entry.firstAttempt > config.windowMs) {
    store.delete(key);
    return {
      allowed: true,
      remaining: config.maxAttempts,
      lockedUntil: null,
      retryAfterSeconds: 0,
      attemptCount: 0,
    };
  }

  return {
    allowed: entry.count < config.maxAttempts,
    remaining: Math.max(0, config.maxAttempts - entry.count),
    lockedUntil: null,
    retryAfterSeconds: 0,
    attemptCount: entry.count,
  };
}

// ============ RECORD FAILED ATTEMPT ============
export function recordFailedAttempt(
  key: string,
  config: { maxAttempts: number; windowMs: number; lockoutMs: number; exponential: boolean }
): RateLimitResult {
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || now - entry.firstAttempt > config.windowMs) {
    entry = {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
      lockedUntil: null,
      lockoutCount: 0,
    };
    store.set(key, entry);
    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      lockedUntil: null,
      retryAfterSeconds: 0,
      attemptCount: 1,
    };
  }

  entry.count += 1;
  entry.lastAttempt = now;

  // Trigger lockout
  if (entry.count >= config.maxAttempts) {
    let lockoutMs = config.lockoutMs;
    if (config.exponential && entry.lockoutCount > 0) {
      const multiplier = Math.min(Math.pow(2, entry.lockoutCount), 4);
      lockoutMs = Math.min(config.lockoutMs * multiplier, 60 * 60 * 1000);
    }
    entry.lockedUntil = now + lockoutMs;
    entry.lockoutCount += 1;
    store.set(key, entry);
    return {
      allowed: false,
      remaining: 0,
      lockedUntil: entry.lockedUntil,
      retryAfterSeconds: Math.ceil(lockoutMs / 1000),
      attemptCount: entry.count,
    };
  }

  store.set(key, entry);
  return {
    allowed: true,
    remaining: config.maxAttempts - entry.count,
    lockedUntil: null,
    retryAfterSeconds: 0,
    attemptCount: entry.count,
  };
}

// ============ RESET ON SUCCESS ============
export function resetRateLimit(key: string) {
  store.delete(key);
}