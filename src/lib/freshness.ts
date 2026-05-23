import type { Freshness, FreshnessStatus } from "@/types";

export function makeFreshness(
  source: string,
  fetchedAt: string | null,
  status: FreshnessStatus,
  message?: string
): Freshness {
  const ageSeconds = fetchedAt ? Math.max(0, Math.floor((Date.now() - new Date(fetchedAt).getTime()) / 1000)) : null;
  return { source, fetchedAt, ageSeconds, status, message };
}

export function classifyFreshness(fetchedAt: string | null, maxFreshSeconds = 60, maxCacheSeconds = 900): FreshnessStatus {
  if (!fetchedAt) return "error";
  const ageSeconds = Math.max(0, Math.floor((Date.now() - new Date(fetchedAt).getTime()) / 1000));
  if (ageSeconds <= maxFreshSeconds) return "fresh";
  if (ageSeconds <= maxCacheSeconds) return "cached";
  return "stale";
}

