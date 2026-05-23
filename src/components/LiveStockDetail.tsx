"use client";

import { useEffect, useState } from "react";
import type { Candle, Freshness, IndicatorPoint, StockDetail } from "@/types";
import { marketDataPollMs } from "@/lib/polling";
import type { SwingAnalysis } from "@/lib/swing";
import { DataSourceBadge } from "./DataSourceBadge";
import { FreshnessBadge } from "./FreshnessBadge";
import { RangeIndicatorPanel } from "./RangeIndicatorPanel";
import { SwingAssistantPanel } from "./SwingAssistantPanel";
import { WatchlistButton } from "./WatchlistButton";

const format = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return "--";
  return typeof value === "number" ? value.toLocaleString("en-IN") : value;
};

export function LiveStockDetail({
  symbol,
  initialStock,
  initialQuoteFreshness,
  initialCandles,
  initialIndicators,
  initialHistoryFreshness,
  initiallyTracked,
  swingAnalysis
}: {
  symbol: string;
  initialStock: StockDetail;
  initialQuoteFreshness: Freshness;
  initialCandles: Candle[];
  initialIndicators: IndicatorPoint[];
  initialHistoryFreshness: Freshness;
  initiallyTracked: boolean;
  swingAnalysis?: SwingAnalysis | null;
}) {
  const [stock, setStock] = useState(initialStock);
  const [quoteFreshness, setQuoteFreshness] = useState(initialQuoteFreshness);
  const [refreshing, setRefreshing] = useState(false);
  const liveStatus =
    refreshing
      ? "Updating..."
      : quoteFreshness.status === "fresh"
        ? "Live"
        : quoteFreshness.status === "cached"
          ? "Live failed - cache"
          : quoteFreshness.status === "stale"
            ? "Live failed - stale"
            : "Live unavailable";

  useEffect(() => {
    let cancelled = false;

    async function refreshQuote() {
      setRefreshing(true);
      try {
        const response = await fetch(`/api/stocks/${encodeURIComponent(symbol)}`, { cache: "no-store" });
        const payload = await response.json();
        if (!cancelled && payload.data) {
          setStock(payload.data);
          setQuoteFreshness(payload.freshness ?? payload.data.freshness ?? initialQuoteFreshness);
        } else if (!cancelled && payload.freshness) {
          setQuoteFreshness(payload.freshness);
        }
      } catch {
        if (!cancelled) {
          setQuoteFreshness((current) => ({
            ...current,
            status: current.fetchedAt ? current.status : "error",
            message: "Live refresh request failed"
          }));
        }
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    }

    refreshQuote();
    const id = window.setInterval(refreshQuote, marketDataPollMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [initialQuoteFreshness, symbol]);

  return (
    <>
      <div className="panel-header">
        <div>
          <h1 style={{ margin: 0 }}>{stock.symbol}</h1>
          <div className="muted">{stock.companyName}</div>
        </div>
        <div className="row">
          <FreshnessBadge freshness={quoteFreshness} />
          <span className={`live-pulse ${quoteFreshness.status}`}>{liveStatus}</span>
          <WatchlistButton symbol={symbol} initialTracked={initiallyTracked} />
        </div>
      </div>
      <section className="metric-grid" style={{ marginBottom: 24 }}>
        {stock.metrics.map((metric) => (
          <div className="metric-card" key={metric.label}>
            <DataSourceBadge freshness={quoteFreshness} />
            <div className="muted">{metric.label}</div>
            <div className="price">{format(metric.value)}</div>
          </div>
        ))}
      </section>
      {swingAnalysis ? <SwingAssistantPanel analysis={swingAnalysis} indicators={initialIndicators} /> : null}
      <RangeIndicatorPanel
        symbol={symbol}
        initialCandles={initialCandles}
        initialIndicators={initialIndicators}
        initialFreshness={initialHistoryFreshness}
      />
    </>
  );
}
