import type { Candle, StockDetail } from "@/types";
import { makeFreshness } from "@/lib/freshness";

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      meta?: {
        longName?: string;
        shortName?: string;
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        previousClose?: number;
        regularMarketVolume?: number;
        regularMarketDayHigh?: number;
        regularMarketDayLow?: number;
        fiftyTwoWeekHigh?: number;
        fiftyTwoWeekLow?: number;
      };
      indicators?: {
        quote?: Array<{
          open?: Array<number | null>;
          high?: Array<number | null>;
          low?: Array<number | null>;
          close?: Array<number | null>;
          volume?: Array<number | null>;
        }>;
      };
    }>;
    error?: { description?: string };
  };
};

const numberOrUndefined = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : undefined);

function yahooRange(range: string | null) {
  switch (range) {
    case "1D":
      return "1d";
    case "1W":
      return "7d";
    case "3M":
      return "3mo";
    case "6M":
      return "6mo";
    case "1Y":
      return "1y";
    case "1M":
    default:
      return "1mo";
  }
}

function yahooInterval(range: string | null) {
  return range === "1D" ? "1m" : "1d";
}

export async function getYahooHistory(symbol: string, range: string | null): Promise<Candle[]> {
  const yahooSymbol = `${symbol.toUpperCase()}.NS`;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=${yahooRange(
    range
  )}&interval=${yahooInterval(range)}`;
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "Mozilla/5.0"
    },
    cache: "no-store",
    signal: AbortSignal.timeout(5000)
  });

  if (!response.ok) {
    throw new Error(`Yahoo chart request failed with ${response.status}`);
  }

  const payload = (await response.json()) as YahooChartResponse;
  const result = payload.chart?.result?.[0];
  const quote = result?.indicators?.quote?.[0];
  if (!result?.timestamp?.length || !quote) {
    throw new Error(payload.chart?.error?.description ?? "Yahoo returned no candles");
  }

  return result.timestamp
    .map((timestamp, index) => {
      const open = quote.open?.[index];
      const high = quote.high?.[index];
      const low = quote.low?.[index];
      const close = quote.close?.[index];
      if (open === null || high === null || low === null || close === null) return null;
      if (open === undefined || high === undefined || low === undefined || close === undefined) return null;
      return {
        time:
          range === "1D"
            ? new Date(timestamp * 1000).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: "Asia/Kolkata"
              })
            : new Date(timestamp * 1000).toISOString().slice(0, 10),
        open,
        high,
        low,
        close,
        volume: quote.volume?.[index] ?? 0
      };
    })
    .filter((candle): candle is Candle => candle !== null);
}

export async function getYahooQuote(symbol: string): Promise<StockDetail> {
  const normalized = symbol.toUpperCase();
  const yahooSymbol = `${normalized}.NS`;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=1d&interval=1m`;
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "Mozilla/5.0"
    },
    cache: "no-store",
    signal: AbortSignal.timeout(8000)
  });

  if (!response.ok) {
    throw new Error(`Yahoo quote request failed with ${response.status}`);
  }

  const payload = (await response.json()) as YahooChartResponse;
  const result = payload.chart?.result?.[0];
  const meta = result?.meta;
  const quote = result?.indicators?.quote?.[0];
  const closes = quote?.close?.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const lastPrice = numberOrUndefined(meta?.regularMarketPrice) ?? closes?.at(-1);
  const previousClose = numberOrUndefined(meta?.previousClose) ?? numberOrUndefined(meta?.chartPreviousClose);
  if (lastPrice === undefined) {
    throw new Error(payload.chart?.error?.description ?? "Yahoo returned no quote price");
  }

  const change = previousClose === undefined ? undefined : lastPrice - previousClose;
  const pChange = previousClose === undefined || previousClose === 0 ? undefined : (change! / previousClose) * 100;
  const freshness = makeFreshness("yahoo-quote", new Date().toISOString(), "fresh");
  const detail: StockDetail = {
    symbol: normalized,
    companyName: meta?.longName ?? meta?.shortName ?? normalized,
    lastPrice,
    previousClose,
    change,
    pChange,
    totalTradedVolume: numberOrUndefined(meta?.regularMarketVolume) ?? quote?.volume?.findLast((value) => value !== null) ?? undefined,
    dayHigh: numberOrUndefined(meta?.regularMarketDayHigh),
    dayLow: numberOrUndefined(meta?.regularMarketDayLow),
    yearHigh: numberOrUndefined(meta?.fiftyTwoWeekHigh),
    yearLow: numberOrUndefined(meta?.fiftyTwoWeekLow),
    freshness,
    metrics: []
  };

  detail.metrics = [
    { label: "Last Price", value: detail.lastPrice ?? null },
    { label: "Change %", value: detail.pChange ?? null },
    { label: "PE", value: detail.pe ?? null },
    { label: "PB", value: detail.pb ?? null },
    { label: "VWAP", value: detail.vwap ?? null },
    { label: "Volume", value: detail.totalTradedVolume ?? null },
    { label: "52W High", value: detail.yearHigh ?? null },
    { label: "52W Low", value: detail.yearLow ?? null }
  ];

  return detail;
}
