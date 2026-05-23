"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { StockSummary } from "@/types";
import { StockTable } from "./StockTable";

export function StockSearchTable({ stocks }: { stocks: StockSummary[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("symbol");
  const [hydrated, setHydrated] = useState<Record<string, StockSummary>>({});
  const [visibleSymbols, setVisibleSymbols] = useState<Record<string, boolean>>({});
  const hydratedStocks = useMemo(
    () => stocks.map((stock) => (hydrated[stock.symbol] ? { ...stock, ...hydrated[stock.symbol] } : stock)),
    [hydrated, stocks]
  );
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const rows = normalized
      ? hydratedStocks.filter(
          (stock) =>
            stock.symbol.toLowerCase().includes(normalized) || stock.companyName.toLowerCase().includes(normalized)
        )
      : hydratedStocks;
    return [...rows].sort((a, b) => {
      if (sort === "change") return (b.pChange ?? -Infinity) - (a.pChange ?? -Infinity);
      if (sort === "volume") return (b.totalTradedVolume ?? -Infinity) - (a.totalTradedVolume ?? -Infinity);
      return a.symbol.localeCompare(b.symbol);
    });
  }, [hydratedStocks, query, sort]);

  useEffect(() => {
    const controller = new AbortController();
    const missing = filtered
      .filter(
        (stock, index) =>
          stock.lastPrice === undefined && !hydrated[stock.symbol] && (index < 24 || visibleSymbols[stock.symbol])
      )
      .slice(0, 24)
      .map((stock) => stock.symbol);

    async function hydrateVisibleRows() {
      for (let index = 0; index < missing.length; index += 4) {
        if (controller.signal.aborted) return;
        const batch = missing.slice(index, index + 4);
        const quotes = await Promise.all(
          batch.map(async (symbol) => {
            try {
              const response = await fetch(`/api/stocks/${encodeURIComponent(symbol)}?fast=1`, {
                cache: "no-store",
                signal: controller.signal
              });
              if (!response.ok) return null;
              const payload = await response.json();
              return payload.data ? [symbol, payload.data] : null;
            } catch {
              return null;
            }
          })
        );
        const next = Object.fromEntries(quotes.filter((quote): quote is [string, StockSummary] => Boolean(quote)));
        if (Object.keys(next).length) {
          setHydrated((current) => ({ ...current, ...next }));
        }
      }
    }

    hydrateVisibleRows();
    return () => controller.abort();
  }, [filtered, hydrated, visibleSymbols]);

  const markRowVisible = useCallback((symbol: string) => {
    setVisibleSymbols((current) => (current[symbol] ? current : { ...current, [symbol]: true }));
  }, []);

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
      <StockTable stocks={filtered} onRowVisible={markRowVisible} />
    </div>
  );
}
