import { describe, expect, test } from "vitest";
import type { Candle, IndicatorPoint, StockDetail } from "@/types";
import { analyzeSwingSetup } from "./swing";

function makeCandles(lastClose: number): Candle[] {
  return Array.from({ length: 45 }, (_, index) => {
    const close = index === 44 ? lastClose : 100 + index * 0.2;
    return {
      time: `2026-05-${String(index + 1).padStart(2, "0")}`,
      open: close - 0.5,
      high: close + 1,
      low: index === 10 ? 100 : close - 1,
      close,
      volume: 1000
    };
  });
}

function makeIndicators(overrides: Partial<IndicatorPoint>): IndicatorPoint[] {
  return [
    {
      time: "2026-05-45",
      close: 110,
      sma20: 105,
      ema20: 105,
      rsi14: 55,
      macd: null,
      macdSignal: null,
      bollingerUpper: null,
      bollingerMiddle: null,
      bollingerLower: null,
      stochasticK: null,
      roc12: 5,
      momentum10: 5,
      volumeTrend: null,
      ...overrides
    }
  ];
}

function makeStock(lastPrice = 110): StockDetail {
  return {
    symbol: "TEST",
    companyName: "Test Limited",
    lastPrice,
    freshness: {
      source: "Test",
      fetchedAt: "2026-05-23T00:00:00.000Z",
      ageSeconds: 0,
      status: "fresh"
    },
    metrics: []
  };
}

describe("swing setup analysis", () => {
  test("promotes only optimized continuation setups to BUY", () => {
    const analysis = analyzeSwingSetup(makeStock(), makeCandles(110), makeIndicators({}));

    expect(analysis.signal).toBe("BUY");
    expect(analysis.reasons).toContain("Passed the optimized +10% continuation filter.");
  });

  test("avoids high-scoring setups when ROC strength misses the optimized filter", () => {
    const analysis = analyzeSwingSetup(makeStock(), makeCandles(110), makeIndicators({ roc12: 1 }));

    expect(analysis.score).toBeGreaterThanOrEqual(72);
    expect(analysis.signal).toBe("AVOID");
    expect(analysis.cautions).toContain("Backtest filter is not confirmed for a higher-probability +10% setup.");
  });
});
