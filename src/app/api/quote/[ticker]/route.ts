import { NextResponse } from "next/server";
import { fetchCompanyData } from "@/lib/data-fetcher";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;
    const finnhubKey = request.headers.get("x-finnhub-key") || process.env.FINNHUB_API_KEY || "";
    
    const data = await fetchCompanyData(ticker, finnhubKey);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Quote API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
