"use client";

import { Star } from "lucide-react";
import { useState, useTransition } from "react";

export function WatchlistButton({ symbol, initialTracked }: { symbol: string; initialTracked: boolean }) {
  const [tracked, setTracked] = useState(initialTracked);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      if (tracked) {
        await fetch(`/api/watchlist?symbol=${encodeURIComponent(symbol)}`, { method: "DELETE" });
      } else {
        await fetch("/api/watchlist", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ symbol })
        });
      }
      setTracked(!tracked);
    });
  }

  return (
    <button className={tracked ? "primary-button" : "ghost-button"} onClick={toggle} disabled={isPending}>
      <Star size={16} style={{ verticalAlign: "text-bottom", marginRight: 8 }} />
      {tracked ? "Watching" : "Add to watchlist"}
    </button>
  );
}

