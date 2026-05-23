# Stockviewer Design

## Goal

Stockviewer is a full-stack NSE stock dashboard focused on fresh live data, rich quote detail, momentum analysis, dynamic charts, and a persistent watchlist. It should feel like a production dashboard, using the provided TailAdmin-style reference: dark sidebar, compact header, horizontal market cards, chart-led content, and a separate stock tracking area.

## Data Strategy

The app will use a provider-adapter backend so data sources can be ranked and swapped without changing the UI. The primary free source is NSE website JSON endpoints, called only from the server with session handling, browser-like headers, retries, throttling, and per-symbol freshness metadata. The system will store only successful live pulls in a local cache and may serve slightly expired data only when a fresh pull fails.

Every API response includes freshness data: source, fetched timestamp, age in seconds, and status (`fresh`, `cached`, `stale`, or `error`). The UI must clearly show whether a value is live or cached. No demo or invented market values are allowed.

## Backend

The backend exposes application-facing endpoints:

- `GET /api/stocks`: list NSE equities with price/change fields when available.
- `GET /api/stocks/:symbol`: detailed quote, fundamentals, valuation fields, market depth if available, and freshness metadata.
- `GET /api/stocks/:symbol/history?range=...`: candle data for chart ranges.
- `GET /api/stocks/:symbol/indicators?range=...`: calculated RSI, MACD, moving averages, Bollinger Bands, stochastic, rate of change, momentum, and volume trend.
- `GET/POST/DELETE /api/watchlist`: local watchlist management.

The service computes momentum values locally from candle data where the upstream source does not provide them directly. It persists symbols, last successful quotes, candle pulls, indicator snapshots, and watchlist entries in a local SQLite database.

## Frontend

The first screen is the actual dashboard, not a landing page. It uses:

- Dark sidebar with app name `Stockviewer`, primary navigation, and active states.
- Header with search, refresh/freshness status, and lightweight controls.
- Horizontal stock cards for featured or active stocks with mini sparklines.
- Main investment/chart panel with range selector and dynamic graph.
- `My Stocks` watchlist panel on the dashboard.
- Full stock table/list screen for all NSE stocks with search, sorting, and freshness badges.
- Stock detail screen with valuation cards, quote fields, momentum cards, range controls, and selectable indicator charts.
- Watchlist screen focused on tracked stocks, freshness, quick metrics, and fast navigation to detail.

The design should be dense, clean, and operational rather than marketing-like. Cards should use modest radius, restrained shadows, good spacing, and readable financial color semantics.

## Error Handling

If live fetching fails, the backend returns the newest successful cached data plus a clear status when available. If no cached data exists, the UI shows a useful empty/error state and a retry action. NSE blocking, network failures, malformed responses, and missing metrics should not crash the page.

## Verification

Implementation verification must include:

- Backend data fetch smoke tests.
- Indicator calculation tests on deterministic candle samples.
- App build/lint checks.
- Browser walkthrough of dashboard, all-stocks, stock detail, and watchlist.
- Screenshots reviewed and UI fixes made for spacing, overlap, loading, and error states.

