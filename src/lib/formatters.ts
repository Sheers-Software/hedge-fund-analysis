import { CompanyData } from "./types";

export function buildDataSummary(data: CompanyData): string {
  const info = data.info || {};
  const fin = data.financials || {};
  const quote = data.real_time_quote || {};
  const news = data.news || [];
  const peers = data.peers || [];

  const newsContext = news.length > 0 
    ? news.slice(0, 6).map(n => `- [${n.datetime}] ${n.headline} (${n.source})`).join("\n")
    : "No recent news available";

  return `
COMPANY: ${info.longName || data.ticker} (${data.ticker})
SECTOR: ${info.sector || 'N/A'} | INDUSTRY: ${info.industry || 'N/A'}
EXCHANGE: ${info.exchange || 'N/A'} | COUNTRY: ${info.country || 'N/A'}

CURRENT PRICE: $${quote.current || 'N/A'} | Change: ${quote.change_pct || 'N/A'}%
52W Range: $${fin['52w_low'] || 'N/A'} - $${fin['52w_high'] || 'N/A'}
MARKET CAP: ${fin.market_cap_formatted || 'N/A'}
ENTERPRISE VALUE: ${fin.enterprise_value || 'N/A'}

VALUATION MULTIPLES:
- P/E (Trailing): ${fin.pe_ratio || 'N/A'}
- P/E (Forward): ${fin.forward_pe || 'N/A'}
- P/S Ratio: ${fin.ps_ratio || 'N/A'}
- EV/EBITDA: ${fin.ev_ebitda || 'N/A'}
- EV/Revenue: ${fin.ev_revenue || 'N/A'}
- PEG Ratio: ${fin.peg_ratio || 'N/A'}

FINANCIALS:
- Revenue (TTM): ${fin.revenue_formatted || 'N/A'}
- Net Income: ${fin.net_income_formatted || 'N/A'}
- Free Cash Flow: ${fin.free_cashflow || 'N/A'}
- Revenue Growth (YoY): ${fin.revenue_growth || 'N/A'}
- Earnings Growth: ${fin.earnings_growth || 'N/A'}

MARGINS:
- Gross Margin: ${fin.gross_margin || 'N/A'}
- Operating Margin: ${fin.operating_margin || 'N/A'}
- Net Profit Margin: ${fin.profit_margin || 'N/A'}

RETURNS:
- ROE: ${fin.roe || 'N/A'}
- ROA: ${fin.roa || 'N/A'}

BALANCE SHEET:
- Total Cash: ${fin.total_cash || 'N/A'}
- Total Debt: ${fin.total_debt || 'N/A'}
- Debt/Equity: ${fin.debt_to_equity || 'N/A'}
- Current Ratio: ${fin.current_ratio || 'N/A'}

SHARE STATISTICS:
- Shares Outstanding: ${fin.shares_outstanding || 'N/A'}
- Float Shares: ${fin.float_shares || 'N/A'}
- Insider Ownership: ${fin.insider_ownership || 'N/A'}
- Institutional Ownership: ${fin.institutional_ownership || 'N/A'}
- Short Ratio: ${fin.short_ratio || 'N/A'}
- Beta: ${fin.beta || 'N/A'}
- Dividend Yield: ${fin.dividend_yield || 'N/A'}

EARNINGS:
- Trailing EPS: $${fin.trailing_eps || 'N/A'}
- Forward EPS: $${fin.forward_eps || 'N/A'}
- Analyst Target Price: $${fin.analyst_target || 'N/A'}
- Analyst Consensus: ${fin.analyst_rec || 'N/A'} (${fin.num_analyst_opinions || 'N/A'} analysts)

PEERS: ${peers.length > 0 ? peers.join(', ') : 'N/A'}

RECENT NEWS:
${newsContext}

BUSINESS DESCRIPTION (first 600 chars):
${String(info.longBusinessSummary || 'N/A').substring(0, 600)}
  `.trim();
}

export function buildNewsContext(data: CompanyData): string {
  if (!data.news || data.news.length === 0) return "No recent news available.";
  return data.news.slice(0, 8).map(n => 
    `• [${n.datetime}] ${n.headline} — ${n.source}\n  Summary: ${n.summary.substring(0, 200)}`
  ).join("\n");
}
