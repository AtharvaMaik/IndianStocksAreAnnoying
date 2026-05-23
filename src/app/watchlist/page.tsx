import { AppShell } from "@/components/AppShell";
import { StockCard } from "@/components/StockCard";
import { getStocks } from "@/lib/nse/service";
import { getWatchlist } from "@/lib/store";

export default async function WatchlistPage() {
  const [stocksResponse, entries] = await Promise.all([getStocks(), getWatchlist()]);
  const bySymbol = new Map(stocksResponse.data.map((stock) => [stock.symbol, stock]));
  const stocks = entries.map((entry) => bySymbol.get(entry.symbol)).filter((stock): stock is NonNullable<typeof stock> => Boolean(stock));

  return (
    <AppShell>
      <div className="page">
        <div className="panel-header">
          <div>
            <h1 style={{ margin: 0 }}>Watchlist</h1>
            <div className="muted">A focused screen for stocks you actively track</div>
          </div>
        </div>
        {stocks.length ? (
          <section className="stock-strip">
            {stocks.map((stock) => (
              <StockCard stock={stock} key={stock.symbol} />
            ))}
          </section>
        ) : (
          <div className="panel">
            <div className="empty-state">Your watchlist is empty. Open a stock detail page and add it from there.</div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

