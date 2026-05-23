import Link from "next/link";
import type { StockSummary, WatchlistEntry } from "@/types";

const price = (value?: number) => (value === undefined ? "—" : `₹${value.toLocaleString("en-IN")}`);

export function WatchlistPanel({ entries, stocks }: { entries: WatchlistEntry[]; stocks: StockSummary[] }) {
  const bySymbol = new Map(stocks.map((stock) => [stock.symbol, stock]));
  const visible = entries.map((entry) => bySymbol.get(entry.symbol)).filter((stock): stock is StockSummary => Boolean(stock));

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">My Stocks</div>
          <div className="muted">{visible.length} tracked</div>
        </div>
        <Link className="ghost-button" href="/watchlist">
          View all
        </Link>
      </div>
      {visible.length === 0 ? (
        <div className="empty-state">Add stocks from any detail page to start tracking them here.</div>
      ) : (
        <div className="grid">
          {visible.slice(0, 8).map((stock) => (
            <a className="row" href={`/stocks/${stock.symbol}`} key={stock.symbol}>
              <span className="avatar">{stock.symbol.slice(0, 1)}</span>
              <span style={{ flex: 1 }}>
                <strong>{stock.symbol}</strong>
                <span className="muted" style={{ display: "block" }}>
                  {stock.companyName}
                </span>
              </span>
              <span style={{ textAlign: "right" }}>
                <strong>{price(stock.lastPrice)}</strong>
                <span className={(stock.pChange ?? 0) >= 0 ? "positive" : "negative"} style={{ display: "block" }}>
                  {stock.pChange?.toFixed(2) ?? "—"}%
                </span>
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
