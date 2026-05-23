"use client";

import { useEffect, useRef } from "react";
import type { StockSummary } from "@/types";

const number = (value?: number) => (value === undefined ? "--" : value.toLocaleString("en-IN"));
const price = (value?: number) => (value === undefined ? "--" : `₹${value.toLocaleString("en-IN")}`);

function StockRow({ stock, onRowVisible }: { stock: StockSummary; onRowVisible?: (symbol: string) => void }) {
  const rowRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    if (!onRowVisible || stock.lastPrice !== undefined) return;
    const element = rowRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        onRowVisible(stock.symbol);
        observer.disconnect();
      },
      { rootMargin: "500px 0px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [onRowVisible, stock.lastPrice, stock.symbol]);

  return (
    <tr ref={rowRef}>
      <td>
        <a className="table-link" href={`/stocks/${stock.symbol}`}>
          <strong>{stock.symbol}</strong>
        </a>
      </td>
      <td>
        <a className="table-link" href={`/stocks/${stock.symbol}`}>
          {stock.companyName}
        </a>
      </td>
      <td>
        <a className="table-link" href={`/stocks/${stock.symbol}`}>
          {price(stock.lastPrice)}
        </a>
      </td>
      <td className={(stock.pChange ?? 0) >= 0 ? "positive" : "negative"}>
        <a className="table-link" href={`/stocks/${stock.symbol}`}>
          {stock.pChange?.toFixed(2) ?? "--"}%
        </a>
      </td>
      <td>
        <a className="table-link" href={`/stocks/${stock.symbol}`}>
          {number(stock.totalTradedVolume)}
        </a>
      </td>
      <td>
        <a className="table-link" href={`/stocks/${stock.symbol}`}>
          {price(stock.dayLow)} / {price(stock.dayHigh)}
        </a>
      </td>
    </tr>
  );
}

export function StockTable({
  stocks,
  limit,
  onRowVisible
}: {
  stocks: StockSummary[];
  limit?: number;
  onRowVisible?: (symbol: string) => void;
}) {
  const rows = limit ? stocks.slice(0, limit) : stocks;
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Company</th>
          <th>Price</th>
          <th>Change</th>
          <th>Volume</th>
          <th>Range</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((stock) => (
          <StockRow stock={stock} onRowVisible={onRowVisible} key={stock.symbol} />
        ))}
      </tbody>
    </table>
  );
}
