export type FreshnessStatus = "fresh" | "cached" | "stale" | "error";

export type Freshness = {
  source: string;
  fetchedAt: string | null;
  ageSeconds: number | null;
  status: FreshnessStatus;
  message?: string;
};

export type StockSummary = {
  symbol: string;
  companyName: string;
  series?: string;
  isin?: string;
  industry?: string;
  lastPrice?: number;
  change?: number;
  pChange?: number;
  totalTradedVolume?: number;
  dayHigh?: number;
  dayLow?: number;
  yearHigh?: number;
  yearLow?: number;
  sparkline?: Candle[];
  freshness: Freshness;
};

export type QuoteMetric = {
  label: string;
  value: string | number | null;
};

export type StockDetail = StockSummary & {
  open?: number;
  previousClose?: number;
  vwap?: number;
  lowerCircuit?: number;
  upperCircuit?: number;
  marketCap?: number;
  pe?: number;
  pb?: number;
  faceValue?: number;
  dividendYield?: number;
  deliveryQuantity?: number;
  deliveryPercent?: number;
  metrics: QuoteMetric[];
};

export type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type IndicatorPoint = {
  time: string;
  close: number;
  sma20: number | null;
  ema20: number | null;
  rsi14: number | null;
  macd: number | null;
  macdSignal: number | null;
  bollingerUpper: number | null;
  bollingerMiddle: number | null;
  bollingerLower: number | null;
  stochasticK: number | null;
  roc12: number | null;
  momentum10: number | null;
  volumeTrend: number | null;
};

export type WatchlistEntry = {
  symbol: string;
  addedAt: string;
};

export type ApiListResponse<T> = {
  data: T[];
  freshness: Freshness;
};

export type ApiItemResponse<T> = {
  data: T;
  freshness: Freshness;
};

