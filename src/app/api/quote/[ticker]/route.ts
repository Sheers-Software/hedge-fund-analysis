import { NextResponse } from "next/server";
import { fetchCompanyData } from "@/lib/data-fetcher";

// Always execute on-demand and never cache: financial quotes must be real-time
// on both localhost and Vercel.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;
    const finnhubKey = request.headers.get("x-finnhub-key") || process.env.FINNHUB_API_KEY || "";
    
    const data = await fetchCompanyData(ticker, finnhubKey);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error: any) {
    console.error("Quote API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
