import type { Candle, Freshness, StockDetail, StockSummary } from "@/types";
import { classifyFreshness, makeFreshness } from "@/lib/freshness";
import { daysForRange, formatNseDate } from "@/lib/ranges";
import { readCache, writeCache } from "@/lib/store";
import { getYahooHistory, getYahooQuote } from "@/lib/yahoo/service";
import { fetchNseJson, fetchNseText } from "./client";
import { normalizeHistory, normalizeQuote, normalizeSummary } from "./normalize";

const equityCsvUrl = "https://archives.nseindia.com/content/equities/EQUITY_L.csv";

function withFreshness<T extends { freshness?: Freshness }>(data: T, freshness: Freshness): T {
  return { ...data, freshness };
}

async function liveOrCache<T>(key: string, source: string, fetchLive: () => Promise<T>, maxFresh = 60) {
  try {
    const data = await fetchLive();
    const recordSource =
      typeof data === "object" && data && "freshness" in data && typeof data.freshness === "object" && data.freshness
        ? String((data.freshness as Freshness).source)
        : source;
    const record = await writeCache(key, recordSource, data);
    return {
      data,
      freshness: makeFreshness(recordSource, record.fetchedAt, "fresh")
    };
  } catch (error) {
    const cached = await readCache<T>(key);
    if (cached) {
      const status = classifyFreshness(cached.fetchedAt, maxFresh);
      return {
        data: cached.data,
        freshness: makeFreshness(cached.source, cached.fetchedAt, status, error instanceof Error ? error.message : "Live pull failed")
      };
    }
    throw error;
  }
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (const character of line) {
    if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) {
      values.push(current);
      current = "";
    } else current += character;
  }
  values.push(current);
  return values.map((value) => value.trim());
}

export async function getStockUniverse() {
  return liveOrCache<StockSummary[]>("stock-universe-v2", "nse-equity-list", async () => {
    const text = await fetchNseText(equityCsvUrl);
    const [headerLine, ...rows] = text.trim().split(/\r?\n/);
    const headers = parseCsvLine(headerLine);
    return rows
      .map((line) => {
        const values = parseCsvLine(line);
        const row = Object.fromEntries(headers.map((header, index) => [header, values[index]]));
        return normalizeSummary(row, "nse-equity-list");
      })
      .filter((stock) => stock.symbol && stock.series === "EQ");
  }, 3600);
}

export async function getLiveMarketStocks() {
  return liveOrCache<StockSummary[]>("live-market", "nse-live-equity-market", async () => {
    const payload = await fetchNseJson<{ data?: Record<string, unknown>[] }>(
      "/api/equity-stockIndices?index=SECURITIES%20IN%20F%26O"
    );
    return (payload.data ?? []).map((row) => normalizeSummary(row, "nse-live-equity-market")).filter((row) => row.symbol);
  }, 45);
}

export async function getStocks() {
  const [universe, live] = await Promise.allSettled([getStockUniverse(), getLiveMarketStocks()]);
  const universeData = universe.status === "fulfilled" ? universe.value.data : [];
  const liveData = live.status === "fulfilled" ? live.value.data : [];
  const liveBySymbol = new Map(liveData.map((stock) => [stock.symbol, stock]));
  const merged = universeData.map((stock) => ({ ...stock, ...liveBySymbol.get(stock.symbol) }));
  const freshness =
    live.status === "fulfilled"
      ? live.value.freshness
      : universe.status === "fulfilled"
        ? universe.value.freshness
        : makeFreshness("nse", null, "error", "Unable to pull NSE stock list");
  return { data: merged.length ? merged : liveData, freshness };
}

export async function getStockQuote(symbol: string) {
  const normalized = symbol.toUpperCase();
  const result = await liveOrCache<StockDetail>(`quote-${normalized}`, "nse-quote-equity", async () => {
    try {
      const payload = await fetchNseJson<Record<string, any>>(`/api/quote-equity?symbol=${encodeURIComponent(normalized)}`);
      return normalizeQuote(normalized, payload, "nse-quote-equity");
    } catch {
      return getYahooQuote(normalized);
    }
  }, 45);
  return { data: withFreshness(result.data, result.freshness), freshness: result.freshness };
}

export async function getFastStockQuote(symbol: string) {
  const normalized = symbol.toUpperCase();
  const result = await liveOrCache<StockDetail>(`quote-fast-${normalized}`, "yahoo-quote", async () => {
    try {
      return await getYahooQuote(normalized);
    } catch {
      return getStockQuote(normalized).then((response) => response.data);
    }
  }, 45);
  return { data: withFreshness(result.data, result.freshness), freshness: result.freshness };
}

export async function getStockHistory(symbol: string, range: string | null): Promise<{ data: Candle[]; freshness: Freshness }> {
  const normalized = symbol.toUpperCase();
  const days = daysForRange(range);
  const to = new Date();
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return liveOrCache<Candle[]>(`history-${normalized}-${range ?? "1M"}`, "nse-yahoo-history", async () => {
    if (range === "1D") {
      const candles = await getYahooHistory(normalized, range);
      if (candles.length) return candles;
      throw new Error("Yahoo returned no intraday candles");
    }
    try {
      const payload = await fetchNseJson<{ data?: Record<string, unknown>[] }>(
        `/api/historical/cm/equity?symbol=${encodeURIComponent(normalized)}&series=[%22EQ%22]&from=${formatNseDate(from)}&to=${formatNseDate(to)}`
      );
      const candles = normalizeHistory(payload.data ?? []);
      if (candles.length) return candles;
      throw new Error("NSE returned no historical candles");
    } catch {
      const candles = await getYahooHistory(normalized, range);
      if (candles.length) return candles;
      throw new Error("Yahoo returned no historical candles");
    }
  }, 300);
}
