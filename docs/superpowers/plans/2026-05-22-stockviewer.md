# Stockviewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Stockviewer, a full-stack live NSE dashboard with stock browsing, detail analytics, dynamic momentum charts, and watchlists.

**Architecture:** Use a Next.js app with server API routes as the NSE proxy/cache boundary. The backend fetches NSE website JSON/CSV endpoints, stores only successful pulls and user watchlist data locally, and exposes normalized data plus freshness metadata to the UI.

**Tech Stack:** Next.js, React, TypeScript, Recharts, lucide-react, file-backed local persistence, NSE web endpoints.

---

## File Structure

- `package.json`, `tsconfig.json`, `next.config.mjs`: project configuration.
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`: dashboard shell and styling.
- `src/app/stocks/page.tsx`, `src/app/stocks/[symbol]/page.tsx`, `src/app/watchlist/page.tsx`: main screens.
- `src/app/api/**/route.ts`: app-facing JSON APIs.
- `src/components/*`: sidebar, header, cards, charts, tables, watchlist UI.
- `src/lib/nse/*`: NSE session, endpoint fetching, normalization, indicators, ranges.
- `src/lib/store.ts`: local cache and watchlist persistence.
- `src/types.ts`: shared TypeScript types.
- `src/lib/indicators.test.ts`: deterministic indicator tests.

## Tasks

### Task 1: Scaffold App

- [x] Create Next.js/TypeScript configuration and install dependencies.
- [x] Add global dashboard styling inspired by the provided TailAdmin reference.
- [x] Add core shared types.

### Task 2: Data Layer

- [x] Implement NSE server fetch helper with browser-like session headers and retry behavior.
- [x] Implement symbol universe, quote detail, historical candles, freshness-aware cache, and watchlist persistence.
- [x] Implement momentum calculations: RSI, SMA/EMA, MACD, Bollinger Bands, stochastic, ROC, momentum, and volume trend.

### Task 3: API Routes

- [x] Add `/api/stocks`, `/api/stocks/[symbol]`, `/api/stocks/[symbol]/history`, `/api/stocks/[symbol]/indicators`, and `/api/watchlist`.
- [x] Ensure all routes return freshness status and do not invent fallback market data.

### Task 4: Dashboard UI

- [x] Build dark sidebar, top header, market cards, main chart panel, stock table, and dashboard watchlist panel.
- [x] Add refresh/freshness indicators and search affordances.

### Task 5: Stock Detail And Watchlist

- [x] Build all-stocks screen with filtering and sorting.
- [x] Build detail screen with quote metrics, range selector, chart, indicator selector, and watchlist action.
- [x] Build watchlist screen with tracked stock cards and empty/error states.

### Task 6: Verification

- [x] Run indicator tests.
- [x] Run lint/build checks.
- [x] Start local server.
- [x] Crawl dashboard, stocks, detail, and watchlist in browser.
- [x] Take screenshots, inspect visual integrity, and make UI fixes.

