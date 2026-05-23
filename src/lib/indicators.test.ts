import { describe, expect, test } from "vitest";
import type { Candle } from "@/types";
import {
  calculateEma,
  calculateIndicators,
  calculateRsi,
  calculateSma
} from "./indicators";

const candles: Candle[] = Array.from({ length: 35 }, (_, index) => {
  const close = 100 + index + (index % 5);
  return {
    time: `2026-05-${String(index + 1).padStart(2, "0")}`,
    open: close - 1,
    high: close + 2,
    low: close - 2,
    close,
    volume: 1000 + index * 50
  };
});

describe("indicator calculations", () => {
  test("calculates SMA only after enough candles exist", () => {
    const sma = calculateSma(candles.map((candle) => candle.close), 5);

    expect(sma[3]).toBeNull();
    expect(sma[4]).toBe(104);
  });

  test("calculates EMA with a seeded first average", () => {
    const ema = calculateEma(candles.map((candle) => candle.close), 5);

    expect(ema[3]).toBeNull();
    expect(ema[4]).toBe(104);
    expect(ema[5]).toBeGreaterThan(104);
  });

  test("calculates bounded RSI values", () => {
    const rsi = calculateRsi(candles.map((candle) => candle.close), 14);
    const populated = rsi.filter((value): value is number => value !== null);

    expect(populated.length).toBeGreaterThan(0);
    expect(Math.min(...populated)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...populated)).toBeLessThanOrEqual(100);
  });

  test("returns complete indicator points aligned to candles", () => {
    const points = calculateIndicators(candles);
    const last = points.at(-1);

    expect(points).toHaveLength(candles.length);
    expect(last?.time).toBe("2026-05-35");
    expect(last?.rsi14).not.toBeNull();
    expect(last?.macd).not.toBeNull();
    expect(last?.bollingerUpper).toBeGreaterThan(last?.bollingerLower ?? 0);
  });
});

