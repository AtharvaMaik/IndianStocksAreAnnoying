import { NextResponse } from "next/server";
import { calculateIndicators } from "@/lib/indicators";
import { getStockHistory } from "@/lib/nse/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { symbol: string } }) {
  const url = new URL(request.url);
  try {
    const history = await getStockHistory(params.symbol, url.searchParams.get("range"));
    return NextResponse.json({ data: calculateIndicators(history.data), freshness: history.freshness });
  } catch (error) {
    return NextResponse.json(
      {
        data: [],
        freshness: {
          source: "nse",
          fetchedAt: null,
          ageSeconds: null,
          status: "error",
          message: error instanceof Error ? error.message : "Unable to load indicators"
        }
      },
      { status: 503 }
    );
  }
}

