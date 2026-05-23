import { AppShell } from "@/components/AppShell";
import { FreshnessBadge } from "@/components/FreshnessBadge";
import { PriceChart } from "@/components/charts";
import { StockCard } from "@/components/StockCard";
import { StockTable } from "@/components/StockTable";
import { WatchlistPanel } from "@/components/WatchlistPanel";
import { getStockHistory, getStocks } from "@/lib/nse/service";
import { getWatchlist } from "@/lib/store";
import { makeFreshness } from "@/lib/freshness";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stocksResponse, watchlist] = await Promise.all([getStocks(), getWatchlist()]);
  const stocks = stocksResponse.data.filter((stock) => stock.symbol);
  const pricedStocks = stocks.filter((stock) => stock.lastPrice !== undefined);
  const featured = (pricedStocks.length ? pricedStocks : stocks).slice(0, 4);
  const chartSymbol = pricedStocks[0]?.symbol;
  const history = chartSymbol
    ? await getStockHistory(chartSymbol, "1M").catch((error) => ({
        data: [],
        freshness: makeFreshness("nse-historical-equity", null, "error", error instanceof Error ? error.message : "No candles")
      }))
    : { data: [], freshness: stocksResponse.freshness };

  return (
    <AppShell>
      <div className="page">
        <div className="panel-header">
          <div>
            <h1 style={{ margin: 0 }}>Dashboard</h1>
            <div className="muted">Live NSE market overview and tracked stocks</div>
          </div>
          <FreshnessBadge freshness={stocksResponse.freshness} />
        </div>
        <section className="stock-strip">
          {featured.map((stock) => (
            <StockCard stock={stock} key={stock.symbol} />
          ))}
        </section>
        <section className="grid dashboard-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">{chartSymbol ? `${chartSymbol} Price Range` : "Price Range"}</div>
                <div className="muted">Last available NSE candles</div>
              </div>
              <FreshnessBadge freshness={history.freshness} />
            </div>
            {history.data.length ? <PriceChart data={history.data} /> : <div className="empty-state">No live candle data available yet.</div>}
          </div>
          <WatchlistPanel entries={watchlist} stocks={stocks} />
        </section>
        <section className="panel" style={{ marginTop: 24 }}>
          <div className="panel-header">
            <div className="panel-title">All Stocks</div>
            <a className="ghost-button" href="/stocks">
              Open screener
            </a>
          </div>
          <StockTable stocks={stocks} limit={12} />
        </section>
      </div>
    </AppShell>
  );
}
