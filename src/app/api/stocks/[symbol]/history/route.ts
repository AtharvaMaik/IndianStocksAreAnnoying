import { NextResponse } from "next/server";
import { getStockHistory } from "@/lib/nse/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { symbol: string } }) {
  const url = new URL(request.url);
  try {
    return NextResponse.json(await getStockHistory(params.symbol, url.searchParams.get("range")));
  } catch (error) {
    return NextResponse.json(
      {
        data: [],
        freshness: {
          source: "nse",
          fetchedAt: null,
          ageSeconds: null,
          status: "error",
          message: error instanceof Error ? error.message : "Unable to load stock history"
        }
      },
      { status: 503 }
    );
  }
}

