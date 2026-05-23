import type { StockSummary } from "@/types";
import { DataSourceBadge } from "./DataSourceBadge";
import { MiniSparkline } from "./charts";

const formatPrice = (value?: number) => (value === undefined ? "—" : `₹${value.toLocaleString("en-IN")}`);

export function StockCard({ stock }: { stock: StockSummary }) {
  const changeClass = (stock.pChange ?? 0) >= 0 ? "positive" : "negative";
  return (
    <a href={`/stocks/${stock.symbol}`} className="stock-card">
      <DataSourceBadge freshness={stock.freshness} />
      <div className="stock-card-top">
        <div className="row">
          <span className="avatar">{stock.symbol.slice(0, 1)}</span>
          <div>
            <strong>{stock.symbol}</strong>
            <div className="muted">{stock.companyName}</div>
          </div>
        </div>
        <MiniSparkline positive={(stock.pChange ?? 0) >= 0} />
      </div>
      <div className="metric-row" style={{ marginTop: 18 }}>
        <span className="muted">Last Price</span>
        <strong>{formatPrice(stock.lastPrice)}</strong>
      </div>
      <div className="metric-row">
        <span className="muted">Return</span>
        <strong className={changeClass}>{stock.pChange?.toFixed(2) ?? "—"}%</strong>
      </div>
    </a>
  );
}
