"use client";

import { useMemo, useState } from "react";
import type { StockSummary } from "@/types";
import { HydratedStockTable } from "./HydratedStockTable";

export function StockSearchTable({ stocks }: { stocks: StockSummary[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("symbol");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const rows = normalized
      ? stocks.filter(
          (stock) =>
            stock.symbol.toLowerCase().includes(normalized) || stock.companyName.toLowerCase().includes(normalized)
        )
      : stocks;
    return [...rows].sort((a, b) => {
      if (sort === "change") return (b.pChange ?? -Infinity) - (a.pChange ?? -Infinity);
      if (sort === "volume") return (b.totalTradedVolume ?? -Infinity) - (a.totalTradedVolume ?? -Infinity);
      return a.symbol.localeCompare(b.symbol);
    });
  }, [query, sort, stocks]);

  return (
    <div className="panel">
      <div className="panel-header">
        <input
          aria-label="Filter stocks"
          placeholder="Search by symbol or company..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "11px 12px", minWidth: 280 }}
        />
        <select
          aria-label="Sort stocks"
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "11px 12px" }}
        >
          <option value="symbol">Symbol</option>
          <option value="change">Change %</option>
          <option value="volume">Volume</option>
        </select>
      </div>
      <HydratedStockTable stocks={filtered} />
    </div>
  );
}
