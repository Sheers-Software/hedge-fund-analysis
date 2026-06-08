export interface CompanyData {
  ticker: string;
  error: string | null;
  info: any;
  financials: any;
  price_history: any[];
  news: any[];
  peers: string[];
  finnhub_profile: any;
  real_time_quote: any;
}
