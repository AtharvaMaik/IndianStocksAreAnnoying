import { NextResponse } from "next/server";
import { getStocks } from "@/lib/nse/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getStocks());
  } catch (error) {
    return NextResponse.json(
      {
        data: [],
        freshness: {
          source: "nse",
          fetchedAt: null,
          ageSeconds: null,
          status: "error",
          message: error instanceof Error ? error.message : "Unable to load stocks"
        }
      },
      { status: 503 }
    );
  }
}

