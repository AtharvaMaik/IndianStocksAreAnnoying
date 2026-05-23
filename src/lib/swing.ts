import type { Candle, IndicatorPoint, StockDetail } from "@/types";

export type SwingSignal = "BUY" | "WATCH" | "SELL" | "AVOID";

export type SwingAnalysis = {
  signal: SwingSignal;
  score: number;
  confidence: string;
  entry: number | null;
  stopLoss: number | null;
  target: number | null;
  expectedUpsidePercent: number | null;
  riskReward: number | null;
  recentLow: number | null;
  recentHigh: number | null;
  support: { low: number; high: number } | null;
  resistance: { low: number; high: number } | null;
  reasons: string[];
  cautions: string[];
};

const round = (value: number | null, digits = 2) => (value === null ? null : Number(value.toFixed(digits)));

const average = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);

const latestPoint = (points: IndicatorPoint[]) => [...points].reverse().find((point) => point.rsi14 !== null || point.momentum10 !== null);

const isOptimizedContinuationSetup = ({
  score,
  distanceFromLow,
  rsi,
  roc,
  riskReward,
  expectedUpsidePercent,
  closeAboveEma
}: {
  score: number;
  distanceFromLow: number;
  rsi: number | null;
  roc: number | null;
  riskReward: number | null;
  expectedUpsidePercent: number;
  closeAboveEma: boolean;
}) =>
  score >= 56 &&
  distanceFromLow <= 18 &&
  rsi !== null &&
  rsi >= 35 &&
  rsi <= 60 &&
  roc !== null &&
  roc >= 4 &&
  riskReward !== null &&
  riskReward >= 0.8 &&
  expectedUpsidePercent <= 14 &&
  closeAboveEma;

export function analyzeSwingSetup(stock: StockDetail, candles: Candle[], indicators: IndicatorPoint[]): SwingAnalysis {
  const usable = candles.slice(-90);
  const current = stock.lastPrice ?? usable.at(-1)?.close ?? null;
  if (!current || usable.length < 20) {
    return {
      signal: "AVOID",
      score: 0,
      confidence: "Low",
      entry: current,
      stopLoss: null,
      target: null,
      expectedUpsidePercent: null,
      riskReward: null,
      recentLow: null,
      recentHigh: null,
      support: null,
      resistance: null,
      reasons: ["Not enough price history to create a swing setup."],
      cautions: ["Wait for more candles before acting."]
    };
  }

  const recent = usable.slice(-45);
  const lows = recent.map((candle) => candle.low);
  const highs = recent.map((candle) => candle.high);
  const closes = recent.map((candle) => candle.close);
  const volumes = recent.map((candle) => candle.volume);
  const recentLow = Math.min(...lows);
  const recentHigh = Math.max(...highs);
  const support = { low: recentLow * 0.99, high: recentLow * 1.025 };
  const resistanceBase = Math.max(...highs.slice(-20), recentHigh);
  const resistance = { low: resistanceBase * 0.985, high: resistanceBase * 1.015 };
  const distanceFromLow = ((current - recentLow) / recentLow) * 100;
  const target = Math.max(current * 1.1, resistance.high);
  const stopLoss = Math.min(current * 0.94, support.low);
  const expectedUpsidePercent = ((target - current) / current) * 100;
  const downsidePercent = ((current - stopLoss) / current) * 100;
  const riskReward = downsidePercent > 0 ? expectedUpsidePercent / downsidePercent : null;
  const latest = latestPoint(indicators);
  const previousClose = closes.at(-2) ?? current;
  const avgVolume = average(volumes.slice(-20));
  const latestVolume = volumes.at(-1) ?? 0;
  const volumeExpansion = avgVolume > 0 ? latestVolume / avgVolume : 0;
  const ema20 = latest?.ema20 ?? null;
  const sma20 = latest?.sma20 ?? null;
  const rsi = latest?.rsi14 ?? null;
  const momentum = latest?.momentum10 ?? null;
  const roc = latest?.roc12 ?? null;
  const closeAboveEma = ema20 !== null && current > ema20;
  const reversalCandle = current > previousClose && current > recentLow * 1.03;

  let score = 0;
  const reasons: string[] = [];
  const cautions: string[] = [];

  if (distanceFromLow <= 8) {
    score += 22;
    reasons.push(`Price is ${distanceFromLow.toFixed(1)}% above the recent low.`);
  } else if (distanceFromLow <= 14) {
    score += 12;
    reasons.push(`Price is still reasonably close to the recent low (${distanceFromLow.toFixed(1)}%).`);
  } else {
    cautions.push(`Price is already ${distanceFromLow.toFixed(1)}% above the recent low.`);
  }

  if (rsi !== null && rsi >= 35 && rsi <= 58) {
    score += 18;
    reasons.push(`RSI is constructive but not overheated (${rsi.toFixed(1)}).`);
  } else if (rsi !== null && rsi > 70) {
    cautions.push(`RSI is overheated (${rsi.toFixed(1)}).`);
  }

  if (momentum !== null && momentum > 0) {
    score += 16;
    reasons.push("Momentum has turned positive.");
  } else {
    cautions.push("Momentum has not confirmed yet.");
  }

  if (roc !== null && roc > 0) {
    score += 10;
    reasons.push("Rate of change is positive.");
  }

  if (closeAboveEma) {
    score += 14;
    reasons.push("Price is back above EMA 20.");
  } else if (ema20 !== null) {
    cautions.push("Price is still below EMA 20.");
  }

  if (volumeExpansion >= 1.2) {
    score += 12;
    reasons.push(`Volume is ${volumeExpansion.toFixed(1)}x its 20-period average.`);
  } else {
    cautions.push("Volume confirmation is muted.");
  }

  if (reversalCandle) {
    score += 8;
    reasons.push("Recent candle structure suggests a reversal attempt.");
  }

  if (riskReward !== null && riskReward >= 1.5) {
    score += 10;
    reasons.push(`Risk/reward is favorable at ${riskReward.toFixed(2)}x.`);
  } else {
    cautions.push("Risk/reward is not strong enough yet.");
  }

  const optimizedContinuation = isOptimizedContinuationSetup({
    score,
    distanceFromLow,
    rsi,
    roc,
    riskReward,
    expectedUpsidePercent,
    closeAboveEma
  });

  if (optimizedContinuation) {
    reasons.push("Passed the optimized +10% continuation filter.");
  } else if (score >= 52) {
    cautions.push("Backtest filter is not confirmed for a higher-probability +10% setup.");
  }

  const signal: SwingSignal = optimizedContinuation ? (score >= 64 ? "BUY" : "WATCH") : score <= 28 ? "SELL" : "AVOID";
  const confidence = optimizedContinuation && score >= 64 ? "High" : optimizedContinuation ? "Medium" : "Low";

  return {
    signal,
    score: Math.min(100, Math.round(score)),
    confidence,
    entry: round(current),
    stopLoss: round(stopLoss),
    target: round(target),
    expectedUpsidePercent: round(expectedUpsidePercent),
    riskReward: round(riskReward),
    recentLow: round(recentLow),
    recentHigh: round(recentHigh),
    support: { low: round(support.low)!, high: round(support.high)! },
    resistance: { low: round(resistance.low)!, high: round(resistance.high)! },
    reasons,
    cautions
  };
}
