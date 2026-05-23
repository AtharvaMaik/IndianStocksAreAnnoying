export type GoogleFundamentals = {
  pe?: number;
  eps?: number;
  marketCap?: number;
};

const toNumber = (value: string) => {
  const cleaned = value.replace(/[₹,%\s,]/g, "");
  const multiplier = cleaned.endsWith("T") ? 1_000_000_000_000 : cleaned.endsWith("B") ? 1_000_000_000 : cleaned.endsWith("M") ? 1_000_000 : 1;
  const numeric = Number(cleaned.replace(/[TBM]$/, ""));
  return Number.isFinite(numeric) ? numeric * multiplier : undefined;
};

const textAfterLabel = (html: string, label: string) => {
  const pattern = new RegExp(`<div class="SwQK7">${label}</div><div class="dO6ijd">([^<]+)</div>`, "i");
  return html.match(pattern)?.[1];
};

export async function getGoogleFundamentals(symbol: string): Promise<GoogleFundamentals> {
  const url = `https://www.google.com/finance/quote/${encodeURIComponent(symbol.toUpperCase())}:NSE`;
  const response = await fetch(url, {
    headers: {
      accept: "text/html",
      "user-agent": "Mozilla/5.0"
    },
    cache: "no-store",
    signal: AbortSignal.timeout(5000)
  });

  if (!response.ok) {
    throw new Error(`Google Finance request failed with ${response.status}`);
  }

  const html = await response.text();
  return {
    pe: toNumber(textAfterLabel(html, "P/E ratio") ?? ""),
    eps: toNumber(textAfterLabel(html, "EPS") ?? ""),
    marketCap: toNumber(textAfterLabel(html, "Mkt\\. cap") ?? "")
  };
}
