import { NextResponse } from "next/server";
import { addWatchlistSymbol, getWatchlist, removeWatchlistSymbol } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ data: await getWatchlist() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { symbol?: string };
  if (!body.symbol) {
    return NextResponse.json({ message: "Symbol is required" }, { status: 400 });
  }
  return NextResponse.json({ data: await addWatchlistSymbol(body.symbol) });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ message: "Symbol is required" }, { status: 400 });
  }
  return NextResponse.json({ data: await removeWatchlistSymbol(symbol) });
}

