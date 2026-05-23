import type { Candle, IndicatorPoint } from "@/types";

const round = (value: number | null, digits = 2) =>
  value === null || Number.isNaN(value) ? null : Number(value.toFixed(digits));

export function calculateSma(values: number[], period: number): Array<number | null> {
  return values.map((_, index) => {
    if (index < period - 1) return null;
    const window = values.slice(index - period + 1, index + 1);
    return round(window.reduce((sum, value) => sum + value, 0) / period);
  });
}

export function calculateEma(values: number[], period: number): Array<number | null> {
  const multiplier = 2 / (period + 1);
  const result: Array<number | null> = Array(values.length).fill(null);
  let previous: number | null = null;

  values.forEach((value, index) => {
    if (index === period - 1) {
      previous = values.slice(0, period).reduce((sum, item) => sum + item, 0) / period;
      result[index] = round(previous);
      return;
    }

    if (index >= period && previous !== null) {
      previous = (value - previous) * multiplier + previous;
      result[index] = round(previous);
    }
  });

  return result;
}

export function calculateRsi(values: number[], period: number): Array<number | null> {
  const result: Array<number | null> = Array(values.length).fill(null);
  if (values.length <= period) return result;

  let gains = 0;
  let losses = 0;
  for (let index = 1; index <= period; index += 1) {
    const change = values[index] - values[index - 1];
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }

  let averageGain = gains / period;
  let averageLoss = losses / period;
  result[period] = averageLoss === 0 ? 100 : round(100 - 100 / (1 + averageGain / averageLoss));

  for (let index = period + 1; index < values.length; index += 1) {
    const change = values[index] - values[index - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    averageGain = (averageGain * (period - 1) + gain) / period;
    averageLoss = (averageLoss * (period - 1) + loss) / period;
    result[index] = averageLoss === 0 ? 100 : round(100 - 100 / (1 + averageGain / averageLoss));
  }

  return result;
}

function calculateStd(values: number[]) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function calculateIndicators(candles: Candle[]): IndicatorPoint[] {
  const closes = candles.map((candle) => candle.close);
  const volumes = candles.map((candle) => candle.volume);
  const highs = candles.map((candle) => candle.high);
  const lows = candles.map((candle) => candle.low);
  const sma20 = calculateSma(closes, 20);
  const ema20 = calculateEma(closes, 20);
  const ema12 = calculateEma(closes, 12);
  const ema26 = calculateEma(closes, 26);
  const rsi14 = calculateRsi(closes, 14);
  const volumeSma10 = calculateSma(volumes, 10);
  const macdRaw = closes.map((_, index) =>
    ema12[index] !== null && ema26[index] !== null ? (ema12[index] as number) - (ema26[index] as number) : null
  );
  const macdSignal = calculateEma(macdRaw.map((value) => value ?? 0), 9);

  return candles.map((candle, index) => {
    const bollingerWindow = index >= 19 ? closes.slice(index - 19, index + 1) : [];
    const middle = sma20[index];
    const deviation = bollingerWindow.length === 20 ? calculateStd(bollingerWindow) : null;
    const lowWindow = index >= 13 ? lows.slice(index - 13, index + 1) : [];
    const highWindow = index >= 13 ? highs.slice(index - 13, index + 1) : [];
    const lowest = lowWindow.length ? Math.min(...lowWindow) : null;
    const highest = highWindow.length ? Math.max(...highWindow) : null;
    const range = highest !== null && lowest !== null ? highest - lowest : null;
    const previous12 = index >= 12 ? closes[index - 12] : null;
    const previous10 = index >= 10 ? closes[index - 10] : null;

    return {
      time: candle.time,
      close: candle.close,
      sma20: sma20[index],
      ema20: ema20[index],
      rsi14: rsi14[index],
      macd: round(macdRaw[index]),
      macdSignal: macdRaw[index] === null ? null : macdSignal[index],
      bollingerUpper: middle !== null && deviation !== null ? round(middle + deviation * 2) : null,
      bollingerMiddle: middle,
      bollingerLower: middle !== null && deviation !== null ? round(middle - deviation * 2) : null,
      stochasticK: range && lowest !== null ? round(((candle.close - lowest) / range) * 100) : null,
      roc12: previous12 ? round(((candle.close - previous12) / previous12) * 100) : null,
      momentum10: previous10 ? round(candle.close - previous10) : null,
      volumeTrend:
        volumeSma10[index] !== null && volumeSma10[index] !== 0
          ? round((candle.volume / (volumeSma10[index] as number)) * 100)
          : null
    };
  });
}

