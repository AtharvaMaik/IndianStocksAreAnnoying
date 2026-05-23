import type { Freshness } from "@/types";

function sourceLabel(source?: string) {
  switch (source) {
    case "nse-quote-equity":
      return "NSE Quote";
    case "nse-live-equity-market":
      return "NSE Live";
    case "nse-equity-list":
      return "NSE List";
    case "bundled-nse-equity-list":
      return "Bundled NSE List";
    case "nse-yahoo-history":
      return "NSE/Yahoo";
    case "nse-historical-equity":
      return "NSE History";
    case "yahoo-quote":
      return "Yahoo Quote";
    default:
      return source ? source.replace(/-/g, " ") : "Unknown";
  }
}

function recencyLabel(freshness?: Freshness) {
  if (!freshness?.fetchedAt) return "No update";
  if (freshness.status === "fresh" && (freshness.ageSeconds ?? 999) <= 60) return "Live";
  if (freshness.ageSeconds !== null && freshness.ageSeconds !== undefined) {
    if (freshness.ageSeconds < 60) return `${freshness.ageSeconds}s ago`;
    if (freshness.ageSeconds < 3600) return `${Math.floor(freshness.ageSeconds / 60)}m ago`;
  }
  return new Date(freshness.fetchedAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function DataSourceBadge({ freshness }: { freshness?: Freshness }) {
  const title = freshness?.fetchedAt
    ? `${sourceLabel(freshness.source)} last successful update ${new Date(freshness.fetchedAt).toLocaleString("en-IN")}${
        freshness.message ? `. ${freshness.message}` : ""
      }`
    : freshness?.message ?? "No live source update available";

  return (
    <span className={`card-source ${freshness?.status ?? "error"}`} title={title}>
      {sourceLabel(freshness?.source)} - {recencyLabel(freshness)}
    </span>
  );
}
