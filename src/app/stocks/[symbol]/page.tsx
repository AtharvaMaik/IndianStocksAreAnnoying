import { AppShell } from "@/components/AppShell";
import { LiveStockDetail } from "@/components/LiveStockDetail";
import { calculateIndicators } from "@/lib/indicators";
import { makeFreshness } from "@/lib/freshness";
import { getStockHistory, getStockQuote } from "@/lib/nse/service";
import { getWatchlist } from "@/lib/store";
import type { StockDetail } from "@/types";

export default async function StockDetailPage({ params }: { params: { symbol: string } }) {
  const symbol = params.symbol.toUpperCase();
  const [quoteResponse, historyResponse, watchlist] = await Promise.all([
    getStockQuote(symbol).catch((error) => ({
      data: {
        symbol,
        companyName: symbol,
        freshness: makeFreshness("nse-quote-equity", null, "error", error instanceof Error ? error.message : "No quote"),
        metrics: [
          { label: "Last Price", value: null },
          { label: "Change %", value: null },
          { label: "PE", value: null },
          { label: "PB", value: null },
          { label: "VWAP", value: null },
          { label: "Volume", value: null },
          { label: "52W High", value: null },
          { label: "52W Low", value: null }
        ]
      } satisfies StockDetail,
      freshness: makeFreshness("nse-quote-equity", null, "error", error instanceof Error ? error.message : "No quote")
    })),
    getStockHistory(symbol, "1M").catch((error) => ({
      data: [],
      freshness: makeFreshness("nse-historical-equity", null, "error", error instanceof Error ? error.message : "No candles")
    })),
    getWatchlist()
  ]);

  const tracked = watchlist.some((entry) => entry.symbol === symbol);
  const indicators = calculateIndicators(historyResponse.data);

  return (
    <AppShell>
      <div className="page">
        <LiveStockDetail
          symbol={symbol}
          initialStock={quoteResponse.data}
          initialQuoteFreshness={quoteResponse.freshness}
          initialCandles={historyResponse.data}
          initialIndicators={indicators}
          initialHistoryFreshness={historyResponse.freshness}
          initiallyTracked={tracked}
        />
      </div>
    </AppShell>
  );
}

