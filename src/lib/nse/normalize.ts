import type { Candle, StockDetail, StockSummary } from "@/types";
import { makeFreshness } from "@/lib/freshness";

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
};

export function normalizeSummary(row: Record<string, unknown>, source = "nse"): StockSummary {
  const symbol = String(row.symbol ?? row.SYMBOL ?? "").trim().toUpperCase();
  const companyName = String(
    row.meta ? "" : row.companyName ?? row["NAME OF COMPANY"] ?? row.NAME_OF_COMPANY ?? row.symbol ?? symbol
  ).trim();
  return {
    symbol,
    companyName: companyName || symbol,
    series: typeof row.series === "string" ? row.series : typeof row.SERIES === "string" ? row.SERIES : undefined,
    isin:
      typeof row.isin === "string"
        ? row.isin
        : typeof row["ISIN NUMBER"] === "string"
          ? row["ISIN NUMBER"]
          : typeof row.ISIN_NUMBER === "string"
            ? row.ISIN_NUMBER
            : undefined,
    industry: typeof row.industry === "string" ? row.industry : undefined,
    lastPrice: toNumber(row.lastPrice ?? row.last ?? row.ltp),
    change: toNumber(row.change),
    pChange: toNumber(row.pChange ?? row.percentChange),
    totalTradedVolume: toNumber(row.totalTradedVolume ?? row.volume),
    dayHigh: toNumber(row.dayHigh ?? row.high),
    dayLow: toNumber(row.dayLow ?? row.low),
    yearHigh: toNumber(row.yearHigh),
    yearLow: toNumber(row.yearLow),
    freshness: makeFreshness(source, new Date().toISOString(), "fresh")
  };
}

export function normalizeQuote(symbol: string, payload: Record<string, any>, source = "nse"): StockDetail {
  const price = payload.priceInfo ?? {};
  const security = payload.securityInfo ?? {};
  const metadata = payload.metadata ?? {};
  const industryInfo = payload.industryInfo ?? {};
  const preOpen = payload.preOpenMarket ?? {};
  const detail: StockDetail = {
    ...normalizeSummary(
      {
        symbol,
        companyName: payload.info?.companyName ?? metadata.companyName ?? symbol,
        industry: industryInfo.industry,
        lastPrice: price.lastPrice,
        change: price.change,
        pChange: price.pChange,
        dayHigh: price.intraDayHighLow?.max,
        dayLow: price.intraDayHighLow?.min,
        yearHigh: price.weekHighLow?.max,
        yearLow: price.weekHighLow?.min,
        totalTradedVolume: preOpen.totalTradedVolume
      },
      source
    ),
    open: toNumber(price.open),
    previousClose: toNumber(price.previousClose),
    vwap: toNumber(price.vwap),
    lowerCircuit: toNumber(price.lowerCP),
    upperCircuit: toNumber(price.upperCP),
    marketCap: toNumber(security.issuedSize),
    pe: toNumber(metadata.pdSectorPe ?? metadata.pe),
    pb: toNumber(metadata.pb),
    faceValue: toNumber(security.faceValue),
    dividendYield: toNumber(metadata.dividendYield),
    deliveryQuantity: toNumber(security.deliveryQuantity),
    deliveryPercent: toNumber(security.deliveryToTradedQuantity),
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

export function normalizeHistory(rows: Array<Record<string, unknown>>): Candle[] {
  return rows
    .map((row) => {
      const time = String(row.CH_TIMESTAMP ?? row._id ?? row.date ?? "").slice(0, 10);
      const close = toNumber(row.CH_CLOSING_PRICE ?? row.close);
      const open = toNumber(row.CH_OPENING_PRICE ?? row.open);
      const high = toNumber(row.CH_TRADE_HIGH_PRICE ?? row.high);
      const low = toNumber(row.CH_TRADE_LOW_PRICE ?? row.low);
      if (!time || close === undefined || open === undefined || high === undefined || low === undefined) return null;
      return {
        time,
        open,
        high,
        low,
        close,
        volume: toNumber(row.CH_TOT_TRADED_QTY ?? row.volume) ?? 0
      };
    })
    .filter((item): item is Candle => item !== null)
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
}
