import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const finnhubKey = request.headers.get("x-finnhub-key") || "";

  let results: any[] = [];
  
  if (finnhubKey && q) {
    try {
      const res = await fetch(`https://finnhub.io/api/v1/search?q=${encodeURIComponent(q)}&token=${finnhubKey}`);
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          results = data.result
            .filter((item: any) => item.type === "Common Stock" || item.type === "EQS" || item.type === "")
            .map((item: any) => ({
              symbol: item.symbol,
              description: item.description,
              type: item.type
            }))
            .slice(0, 8);
        }
      }
    } catch (e) {
      console.warn("Finnhub search error", e);
    }
  }

  if (results.length === 0 && q) {
    const queryUpper = q.toUpperCase();
    const common = [
      { symbol: "AAPL", description: "Apple Inc.", type: "Common Stock" },
      { symbol: "MSFT", description: "Microsoft Corporation", type: "Common Stock" },
      { symbol: "GOOGL", description: "Alphabet Inc.", type: "Common Stock" },
      { symbol: "AMZN", description: "Amazon.com Inc.", type: "Common Stock" },
      { symbol: "NVDA", description: "NVIDIA Corporation", type: "Common Stock" },
      { symbol: "META", description: "Meta Platforms Inc.", type: "Common Stock" },
      { symbol: "NOW", description: "ServiceNow Inc.", type: "Common Stock" },
      { symbol: "TSLA", description: "Tesla Inc.", type: "Common Stock" },
      { symbol: "NFLX", description: "Netflix Inc.", type: "Common Stock" },
      { symbol: "CRM", description: "Salesforce Inc.", type: "Common Stock" },
    ];
    results = common.filter(item => 
      item.symbol.includes(queryUpper) || item.description.toUpperCase().includes(queryUpper)
    );
  }

  return NextResponse.json({ results });
}
