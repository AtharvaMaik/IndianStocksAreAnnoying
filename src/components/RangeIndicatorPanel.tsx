"use client";

import { useCallback, useEffect, useState } from "react";
import type { Candle, Freshness, IndicatorPoint } from "@/types";
import { buildIndicatorSummaries, type IndicatorKey } from "@/lib/indicatorSummary";
import { ranges } from "@/lib/ranges";
import { marketDataPollMs } from "@/lib/polling";
import { DataSourceBadge } from "./DataSourceBadge";
import { IndicatorChart, MovingAverageChart, PriceChart } from "./charts";

const rangeOptions = ranges;
type ChartTab = "momentum" | "movingAverages";
const movingAverageKeys: IndicatorKey[] = ["sma20", "ema20"];
const indicators: Array<{ key: IndicatorKey; label: string }> = [
  { key: "rsi14", label: "RSI 14" },
  { key: "macd", label: "MACD" },
  { key: "macdSignal", label: "MACD Signal" },
  { key: "sma20", label: "SMA 20" },
  { key: "ema20", label: "EMA 20" },
  { key: "bollingerUpper", label: "Bollinger" },
  { key: "stochasticK", label: "Stochastic" },
  { key: "roc12", label: "ROC" },
  { key: "momentum10", label: "Momentum" },
  { key: "volumeTrend", label: "Volume Trend" }
];

export function RangeIndicatorPanel({
  symbol,
  initialCandles,
  initialIndicators,
  initialFreshness
}: {
  symbol: string;
  initialCandles: Candle[];
  initialIndicators: IndicatorPoint[];
  initialFreshness: Freshness;
}) {
  const [range, setRange] = useState("1M");
  const [chartTab, setChartTab] = useState<ChartTab>("momentum");
  const [metric, setMetric] = useState<IndicatorKey>("rsi14");
  const [candles, setCandles] = useState(initialCandles);
  const [points, setPoints] = useState(initialIndicators);
  const [freshness, setFreshness] = useState(initialFreshness);
  const [loading, setLoading] = useState(false);
  const summaries = buildIndicatorSummaries(points);
  const movingAverageSummaries = summaries.filter((summary) => movingAverageKeys.includes(summary.key));
  const momentumSummaries = summaries.filter((summary) => !movingAverageKeys.includes(summary.key));
  const selectedSummary = summaries.find((summary) => summary.key === metric) ?? summaries[0];

  const refreshCharts = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetch(`/api/stocks/${symbol}/history?range=${range}`, { cache: "no-store" }).then((response) => response.json()),
      fetch(`/api/stocks/${symbol}/indicators?range=${range}`, { cache: "no-store" }).then((response) => response.json())
    ])
      .then(([history, indicatorData]) => {
        if (!cancelled) {
          setCandles(history.data ?? []);
          setPoints(indicatorData.data ?? []);
          setFreshness(indicatorData.freshness ?? history.freshness);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFreshness((current) => ({
            ...current,
            message: "Live chart refresh request failed"
          }));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range, symbol]);

  useEffect(() => {
    return refreshCharts();
  }, [refreshCharts]);

  useEffect(() => {
    const id = window.setInterval(() => {
      refreshCharts();
    }, marketDataPollMs);
    return () => window.clearInterval(id);
  }, [refreshCharts]);

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Price & Momentum</div>
          <div className="muted">{loading ? "Refreshing..." : "Price and momentum indicators"}</div>
        </div>
        <DataSourceBadge freshness={freshness} />
      </div>
      <div className="range-tabs" style={{ marginBottom: 14 }}>
        {rangeOptions.map((option) => (
          <button className={`tab ${range === option ? "active" : ""}`} onClick={() => setRange(option)} key={option}>
            {option}
          </button>
        ))}
      </div>
      {candles.length ? <PriceChart data={candles} /> : <div className="empty-state">No price candles available for this range.</div>}
      <div className="indicator-tabs" style={{ marginTop: 20, marginBottom: 14 }}>
        <button
          className={`tab ${chartTab === "momentum" ? "active" : ""}`}
          onClick={() => {
            setChartTab("momentum");
            if (movingAverageKeys.includes(metric)) setMetric("rsi14");
          }}
        >
          Momentum
        </button>
        <button
          className={`tab ${chartTab === "movingAverages" ? "active" : ""}`}
          onClick={() => {
            setChartTab("movingAverages");
            setMetric("sma20");
          }}
        >
          Moving Averages
        </button>
      </div>
      <div className="indicator-summary-grid">
        {(chartTab === "movingAverages" ? movingAverageSummaries : momentumSummaries).map((summary) => (
          <button
            className={`indicator-card ${metric === summary.key ? "active" : ""}`}
            onClick={() => setMetric(summary.key)}
            key={summary.key}
            title={summary.description}
          >
            <DataSourceBadge freshness={freshness} />
            <span className="muted">{summary.label}</span>
            <strong>{summary.displayValue}</strong>
            <span className={summary.tone}>{summary.signal}</span>
          </button>
        ))}
      </div>
      {chartTab === "movingAverages" ? (
        <>
          <div className="chart-caption" style={{ marginTop: 20 }}>
            <strong>SMA 20 & EMA 20</strong>
            <span className="muted">Close price with simple and exponential moving averages on the same price scale.</span>
          </div>
          {points.length ? <MovingAverageChart data={points} /> : <div className="empty-state">No moving average data available.</div>}
        </>
      ) : (
        <>
          <div className="indicator-tabs" style={{ marginTop: 20, marginBottom: 14 }}>
            {indicators
              .filter((option) => !movingAverageKeys.includes(option.key))
              .map((option) => (
                <button
                  className={`tab ${metric === option.key ? "active" : ""}`}
                  onClick={() => setMetric(option.key)}
                  key={option.key}
                >
                  {option.label}
                </button>
              ))}
          </div>
          <div className="chart-caption">
            <strong>{selectedSummary?.label}</strong>
            <span className="muted">{selectedSummary?.description}</span>
          </div>
          {points.length && selectedSummary ? (
            <IndicatorChart data={points} metric={metric} label={selectedSummary.label} />
          ) : (
            <div className="empty-state">No indicator data available.</div>
          )}
        </>
      )}
    </div>
  );
}
