import fs from "node:fs/promises";
import path from "node:path";
import type { WatchlistEntry } from "@/types";

const dataDir = path.join(process.cwd(), "stockviewer-data");
const cacheDir = path.join(dataDir, "cache");
const watchlistFile = path.join(dataDir, "watchlist.json");

async function ensureDirs() {
  await fs.mkdir(cacheDir, { recursive: true });
}

function keyToFile(key: string) {
  const safe = key.replace(/[^a-z0-9_-]/gi, "_").toLowerCase();
  return path.join(cacheDir, `${safe}.json`);
}

export type CacheRecord<T> = {
  fetchedAt: string;
  source: string;
  data: T;
};

export async function readCache<T>(key: string): Promise<CacheRecord<T> | null> {
  try {
    const text = await fs.readFile(keyToFile(key), "utf8");
    return JSON.parse(text) as CacheRecord<T>;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, source: string, data: T): Promise<CacheRecord<T>> {
  await ensureDirs();
  const record = { fetchedAt: new Date().toISOString(), source, data };
  await fs.writeFile(keyToFile(key), JSON.stringify(record, null, 2), "utf8");
  return record;
}

export async function getWatchlist(): Promise<WatchlistEntry[]> {
  try {
    return JSON.parse(await fs.readFile(watchlistFile, "utf8")) as WatchlistEntry[];
  } catch {
    return [];
  }
}

export async function addWatchlistSymbol(symbol: string): Promise<WatchlistEntry[]> {
  await ensureDirs();
  const normalized = symbol.toUpperCase();
  const entries = await getWatchlist();
  if (!entries.some((entry) => entry.symbol === normalized)) {
    entries.push({ symbol: normalized, addedAt: new Date().toISOString() });
  }
  await fs.writeFile(watchlistFile, JSON.stringify(entries, null, 2), "utf8");
  return entries;
}

export async function removeWatchlistSymbol(symbol: string): Promise<WatchlistEntry[]> {
  await ensureDirs();
  const normalized = symbol.toUpperCase();
  const entries = (await getWatchlist()).filter((entry) => entry.symbol !== normalized);
  await fs.writeFile(watchlistFile, JSON.stringify(entries, null, 2), "utf8");
  return entries;
}

