import type { Freshness } from "@/types";

export function FreshnessBadge({ freshness }: { freshness?: Freshness }) {
  const status = freshness?.status ?? "error";
  const label =
    status === "fresh"
      ? "Live"
      : status === "cached"
        ? "Cache"
        : status === "stale"
          ? "Stale"
          : "Offline";
  const age =
    freshness?.ageSeconds === null || freshness?.ageSeconds === undefined
      ? "no live pull"
      : freshness.ageSeconds < 60
        ? `${freshness.ageSeconds}s old`
        : `${Math.floor(freshness.ageSeconds / 60)}m old`;

  return (
    <span className="freshness" title={freshness?.message}>
      <span className={`dot ${status}`} />
      {label} - {age}
    </span>
  );
}
