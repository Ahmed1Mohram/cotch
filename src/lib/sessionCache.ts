/**
 * sessionCache.ts
 *
 * Centralizes all getSession() and getUser() calls across browser components
 * so auth token requests are deduplicated and cached for 90 seconds.
 *
 * Also provides getCachedIsAdmin() — a shared admin-status cache that prevents
 * every page component (Navbar, Preloader, course pages) from independently
 * calling is_admin/admin_users on mount, which causes 10+ parallel
 * refresh_token requests and triggers Supabase 429 rate-limit errors.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

interface CacheEntry {
  data: {
    session: {
      access_token: string;
      refresh_token: string;
      user: { id: string; email?: string; [key: string]: unknown };
      [key: string]: unknown;
    } | null;
  };
  timestamp: number;
}

// Raised from 45 s → 90 s to reduce token-refresh pressure on page transitions
const CACHE_TTL_MS = 90_000;

let cache: CacheEntry | null = null;
let inflight: Promise<CacheEntry["data"]> | null = null;

/**
 * Returns the current session using an in-memory cache to avoid hammering
 * POST /auth/v1/token?grant_type=refresh_token on component mounts.
 */
export async function getCachedSession(
  supabase: SupabaseClient,
): Promise<CacheEntry["data"]> {
  if (typeof window === "undefined") {
    // SSR — never cache across server requests
    const { data } = await supabase.auth.getSession();
    return data as CacheEntry["data"];
  }

  const now = Date.now();

  // Cache hit — returns cached session immediately without any network calls
  if (cache && now - cache.timestamp < CACHE_TTL_MS) {
    return cache.data;
  }

  // Deduplication: if a request is already in-flight, return the existing promise
  if (inflight) {
    return inflight;
  }

  inflight = supabase.auth
    .getSession()
    .then(({ data }) => {
      const result = (data ?? { session: null }) as CacheEntry["data"];
      cache = { data: result, timestamp: Date.now() };
      inflight = null;
      return result;
    })
    .catch(() => {
      const emptyResult = { session: null } as CacheEntry["data"];
      cache = { data: emptyResult, timestamp: Date.now() };
      inflight = null;
      return emptyResult;
    });

  return inflight;
}

/**
 * Returns the current authenticated user safely from the cached session.
 * Avoids calling supabase.auth.getUser() directly on every component mount,
 * which makes extra server network requests.
 */
export async function getCachedUser(
  supabase: SupabaseClient,
): Promise<{ user: { id: string; email?: string; [key: string]: unknown } | null }> {
  const { session } = await getCachedSession(supabase);
  return { user: session?.user ?? null };
}

/** Call this after signIn / signOut / signUp to clear the cache immediately. */
export function bustSessionCache(): void {
  cache = null;
  inflight = null;
  bustAdminCache();
}

/**
 * After signIn/signUp, the SDK already returned a fresh session.
 * Pre-populate the cache with that session so the next getCachedSession()
 * call returns immediately without any network round-trip.
 */
export function seedSessionCache(session: CacheEntry["data"]["session"]): void {
  cache = { data: { session }, timestamp: Date.now() };
  inflight = null;
}

// ---------------------------------------------------------------------------
// Admin-status cache — shared across all components to prevent duplicate RPCs
// ---------------------------------------------------------------------------

const ADMIN_CACHE_TTL_MS = 90_000; // 90 s — matches session TTL

interface AdminCacheEntry {
  isAdmin: boolean;
  userId: string;
  timestamp: number;
}

let adminCache: AdminCacheEntry | null = null;
let adminInflight: Promise<boolean> | null = null;

/**
 * Returns whether the current user is an admin.
 *
 * Results are cached for 90 s and deduplicated — no matter how many
 * components call this simultaneously (Navbar, Preloader, course pages…),
 * only ONE network request is made to Supabase.
 */
export async function getCachedIsAdmin(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  if (typeof window === "undefined") {
    // SSR — no cache
    return _fetchIsAdmin(supabase, userId);
  }

  const now = Date.now();

  // Cache hit for same user
  if (
    adminCache &&
    adminCache.userId === userId &&
    now - adminCache.timestamp < ADMIN_CACHE_TTL_MS
  ) {
    return adminCache.isAdmin;
  }

  // Deduplicate concurrent calls
  if (adminInflight) {
    return adminInflight;
  }

  adminInflight = _fetchIsAdmin(supabase, userId).then((result) => {
    adminCache = { isAdmin: result, userId, timestamp: Date.now() };
    adminInflight = null;
    return result;
  }).catch(() => {
    adminInflight = null;
    return false;
  });

  return adminInflight;
}

async function _fetchIsAdmin(supabase: SupabaseClient, userId: string): Promise<boolean> {
  try {
    // Try RPC first (fastest)
    const rpcRes = await Promise.resolve(supabase.rpc("is_admin", { uid: userId }));
    if (!rpcRes.error) return Boolean(rpcRes.data);

    // Fallback: direct table query
    const tableRes = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    return Boolean(!tableRes.error && tableRes.data);
  } catch {
    return false;
  }
}

/** Clears the admin status cache — call on sign-out. */
export function bustAdminCache(): void {
  adminCache = null;
  adminInflight = null;
}

