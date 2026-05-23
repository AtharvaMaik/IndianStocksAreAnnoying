import { AppShell } from "@/components/AppShell";
import { FreshnessBadge } from "@/components/FreshnessBadge";
import { StockSearchTable } from "@/components/StockSearchTable";
import { getStocks } from "@/lib/nse/service";

export const dynamic = "force-dynamic";

export default async function StocksPage() {
  const response = await getStocks();
  return (
    <AppShell>
      <div className="page">
        <div className="panel-header">
          <div>
            <h1 style={{ margin: 0 }}>Stocks</h1>
            <div className="muted">Browse NSE equity universe with live fields where available</div>
          </div>
          <FreshnessBadge freshness={response.freshness} />
        </div>
        <StockSearchTable stocks={response.data} />
      </div>
    </AppShell>
  );
}
