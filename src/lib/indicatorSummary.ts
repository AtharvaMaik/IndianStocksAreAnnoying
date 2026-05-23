import type { IndicatorPoint } from "@/types";

export type IndicatorKey = Exclude<keyof IndicatorPoint, "time" | "close">;
export type IndicatorTone = "positive" | "negative" | "neutral";

export type IndicatorSummary = {
  key: IndicatorKey;
  label: string;
  displayValue: string;
  rawValue: number | null;
  signal: string;
  tone: IndicatorTone;
  description: string;
};

export const indicatorDefinitions: Array<{
  key: IndicatorKey;
  label: string;
  unit?: "%";
  description: string;
}> = [
  { key: "rsi14", label: "RSI 14", description: "Relative strength, 70+ overbought and 30- oversold." },
  { key: "macd", label: "MACD", description: "Trend momentum from 12/26 EMA spread." },
  { key: "macdSignal", label: "MACD Signal", description: "Smoothed MACD trigger line." },
  { key: "sma20", label: "SMA 20", description: "20-period simple moving average." },
  { key: "ema20", label: "EMA 20", description: "20-period exponential moving average." },
  { key: "bollingerUpper", label: "Bollinger Upper", description: "Upper volatility band." },
  { key: "bollingerMiddle", label: "Bollinger Mid", description: "20-period Bollinger middle band." },
  { key: "bollingerLower", label: "Bollinger Lower", description: "Lower volatility band." },
  { key: "stochasticK", label: "Stochastic %K", unit: "%", description: "Close position inside the recent high-low range." },
  { key: "roc12", label: "ROC 12", unit: "%", description: "12-period percentage rate of change." },
  { key: "momentum10", label: "Momentum 10", description: "10-period absolute close-price momentum." },
  { key: "volumeTrend", label: "Volume Trend", unit: "%", description: "Volume as a percentage of its 10-period average." }
];

const formatValue = (value: number | null, unit?: "%") => {
  if (value === null) return "Not enough data";
  const formatted = value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  });
  return unit === "%" ? `${formatted}%` : formatted;
};

export function latestIndicatorPoint(points: IndicatorPoint[]) {
  return [...points]
    .reverse()
    .find((point) => indicatorDefinitions.some((definition) => point[definition.key] !== null));
}

function classify(definition: (typeof indicatorDefinitions)[number], value: number | null): Pick<IndicatorSummary, "signal" | "tone"> {
  if (value === null) return { signal: "Waiting", tone: "neutral" };
  if (definition.key === "rsi14") {
    if (value >= 70) return { signal: "Overbought", tone: "negative" };
    if (value <= 30) return { signal: "Oversold", tone: "positive" };
    return { signal: "Neutral", tone: "neutral" };
  }
  if (definition.key === "stochasticK") {
    if (value >= 80) return { signal: "Overbought", tone: "negative" };
    if (value <= 20) return { signal: "Oversold", tone: "positive" };
    return { signal: "Balanced", tone: "neutral" };
  }
  if (definition.key === "volumeTrend") {
    if (value >= 120) return { signal: "High volume", tone: "positive" };
    if (value <= 80) return { signal: "Low volume", tone: "negative" };
    return { signal: "Normal volume", tone: "neutral" };
  }
  if (definition.key === "sma20" || definition.key === "ema20" || definition.key.startsWith("bollinger")) {
    return { signal: "Price level", tone: "neutral" };
  }
  if (value > 0) return { signal: "Positive", tone: "positive" };
  if (value < 0) return { signal: "Negative", tone: "negative" };
  return { signal: "Flat", tone: "neutral" };
}

export function buildIndicatorSummaries(points: IndicatorPoint[]): IndicatorSummary[] {
  const latest = latestIndicatorPoint(points);
  return indicatorDefinitions.map((definition) => {
    const rawValue = latest ? latest[definition.key] : null;
    const value = typeof rawValue === "number" ? rawValue : null;
    return {
      key: definition.key,
      label: definition.label,
      rawValue: value,
      displayValue: formatValue(value, definition.unit),
      ...classify(definition, value),
      description: definition.description
    };
  });
}

