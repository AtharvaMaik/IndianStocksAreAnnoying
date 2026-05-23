"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { StockSummary } from "@/types";

export function GlobalStockSearch() {
  const [query, setQuery] = useState("");
  const [stocks, setStocks] = useState<StockSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (stocks.length) return;
    let cancelled = false;
    setLoading(true);
    fetch("/api/stocks")
      .then((response) => response.json())
      .then((payload) => {
        if (!cancelled) setStocks(payload.data ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [stocks.length]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return stocks.filter((stock) => stock.lastPrice !== undefined).slice(0, 8);

    const score = (stock: StockSummary) => {
      const symbol = stock.symbol.toLowerCase();
      const company = stock.companyName.toLowerCase();
      if (symbol === normalized) return 0;
      if (symbol.startsWith(normalized)) return 1;
      if (company.startsWith(normalized)) return 2;
      if (symbol.includes(normalized)) return 3;
      if (company.includes(normalized)) return 4;
      return 5;
    };

    return stocks
      .filter(
        (stock) =>
          stock.symbol.toLowerCase().includes(normalized) ||
          stock.companyName.toLowerCase().includes(normalized)
      )
      .sort((a, b) => score(a) - score(b) || a.symbol.localeCompare(b.symbol))
      .slice(0, 8);
  }, [query, stocks]);

  function openStock(symbol?: string) {
    const target = symbol ?? results[0]?.symbol;
    if (!target) return;
    window.location.href = `/stocks/${target}`;
  }

  return (
    <div className="search global-search" ref={rootRef}>
      <Search size={17} />
      <input
        placeholder="Type to search NSE stocks..."
        aria-label="Search stocks"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            openStock();
          }
          if (event.key === "Escape") setOpen(false);
        }}
      />
      {open ? (
        <div className="search-results">
          {loading ? <div className="search-empty">Loading stocks...</div> : null}
          {!loading && results.length === 0 ? <div className="search-empty">No matching stocks</div> : null}
          {!loading
            ? results.map((stock) => (
                <button className="search-result" onClick={() => openStock(stock.symbol)} key={stock.symbol}>
                  <span>
                    <strong>{stock.symbol}</strong>
                    <span className="muted">{stock.companyName}</span>
                  </span>
                  <span className={(stock.pChange ?? 0) >= 0 ? "positive" : "negative"}>
                    {stock.lastPrice === undefined ? "Open" : `₹${stock.lastPrice.toLocaleString("en-IN")}`}
                  </span>
                </button>
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
}
