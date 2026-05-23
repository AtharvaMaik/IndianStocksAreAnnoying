import { describe, expect, test } from "vitest";
import type { IndicatorPoint } from "@/types";
import { buildIndicatorSummaries, latestIndicatorPoint } from "./indicatorSummary";

const points: IndicatorPoint[] = [
  {
    time: "2026-05-01",
    close: 100,
    sma20: null,
    ema20: null,
    rsi14: null,
    macd: null,
    macdSignal: null,
    bollingerUpper: null,
    bollingerMiddle: null,
    bollingerLower: null,
    stochasticK: null,
    roc12: null,
    momentum10: null,
    volumeTrend: null
  },
  {
    time: "2026-05-02",
    close: 112,
    sma20: 104,
    ema20: 105,
    rsi14: 72.22,
    macd: 1.5,
    macdSignal: 1.1,
    bollingerUpper: 120,
    bollingerMiddle: 104,
    bollingerLower: 88,
    stochasticK: 83.4,
    roc12: 6.7,
    momentum10: 12,
    volumeTrend: 125
  }
];

describe("indicator summaries", () => {
  test("finds the latest point with populated indicator values", () => {
    expect(latestIndicatorPoint(points)?.time).toBe("2026-05-02");
  });

  test("builds display summaries with values and signals", () => {
    const summaries = buildIndicatorSummaries(points);
    const rsi = summaries.find((item) => item.key === "rsi14");
    const roc = summaries.find((item) => item.key === "roc12");
    const momentum = summaries.find((item) => item.key === "momentum10");

    expect(rsi?.displayValue).toBe("72.22");
    expect(rsi?.signal).toBe("Overbought");
    expect(roc?.displayValue).toBe("6.70%");
    expect(roc?.tone).toBe("positive");
    expect(momentum?.displayValue).toBe("12.00");
  });
});

