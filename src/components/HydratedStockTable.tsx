"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { StockSummary } from "@/types";
import { StockTable } from "./StockTable";

export function HydratedStockTable({
  stocks,
  limit
}: {
  stocks: StockSummary[];
  limit?: number;
}) {
  const [hydrated, setHydrated] = useState<Record<string, StockSummary>>({});
  const [visibleSymbols, setVisibleSymbols] = useState<Record<string, boolean>>({});
  const rows = useMemo(() => {
    const limited = limit ? stocks.slice(0, limit) : stocks;
    return limited.map((stock) => (hydrated[stock.symbol] ? { ...stock, ...hydrated[stock.symbol] } : stock));
  }, [hydrated, limit, stocks]);

  useEffect(() => {
    const controller = new AbortController();
    const missing = rows
      .filter((stock, index) => stock.lastPrice === undefined && !hydrated[stock.symbol] && (index < 24 || visibleSymbols[stock.symbol]))
      .slice(0, 24)
      .map((stock) => stock.symbol);

    async function hydrateRows() {
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

    hydrateRows();
    return () => controller.abort();
  }, [hydrated, rows, visibleSymbols]);

  const markRowVisible = useCallback((symbol: string) => {
    setVisibleSymbols((current) => (current[symbol] ? current : { ...current, [symbol]: true }));
  }, []);

  return <StockTable stocks={rows} onRowVisible={markRowVisible} />;
}
