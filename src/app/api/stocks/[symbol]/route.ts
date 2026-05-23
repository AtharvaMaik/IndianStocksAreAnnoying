import { NextResponse } from "next/server";
import { getFastStockQuote, getStockQuote } from "@/lib/nse/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { symbol: string } }) {
  try {
    const fast = new URL(request.url).searchParams.get("fast") === "1";
    return NextResponse.json(await (fast ? getFastStockQuote(params.symbol) : getStockQuote(params.symbol)));
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        freshness: {
          source: "nse",
          fetchedAt: null,
          ageSeconds: null,
          status: "error",
          message: error instanceof Error ? error.message : "Unable to load stock quote"
        }
      },
      { status: 503 }
    );
  }
}
