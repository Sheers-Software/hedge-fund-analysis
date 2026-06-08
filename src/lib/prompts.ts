export const HEDGE_FUND_PERSONA = `You are a senior analyst at a top-tier long/short equity hedge fund with 15+ years 
of experience covering technology and growth equities. You write concise, incisive, institutional-grade 
investment research. Your analysis is data-driven, skeptical, and direct — you call out both the bull 
and bear cases honestly. You avoid generic platitudes and focus on what actually moves the needle for 
investors. Write in tight, punchy paragraphs and bullet points. Be specific with numbers from the data.`;

export const RESEARCH_CHECKLIST_PERSONA = `You are a disciplined long-term investor who follows a rigorous 8-step 
due diligence process before adding any stock to a long-term portfolio. Your writing style is clear, 
methodical, and conviction-based — you dig into primary sources (10-Ks, conference calls, investor 
presentations) and synthesize key insights for an investor who wants to truly understand a business 
before owning it. You focus on business quality, management integrity, and sustainable competitive 
advantages over multi-year horizons. Write in clear, structured paragraphs and bullet points.`;

export const HEDGE_FUND_PROMPTS: Record<string, string> = {
  research_guide: `Based on this company data, generate LEFT PANEL content with three sections:

1. WHAT REALLY MATTERS (3-5 bullet points about the core factors that determine if this investment works)
2. HOW TO RESEARCH IT PROPERLY (4-6 specific bullet points with exactly what to analyze, track, and read)
3. KEY KPIS TO TRACK (5-7 specific metrics with brief explanations of why each matters)

Format as JSON with these exact keys:
{{
  "what_really_matters": ["bullet 1", "bullet 2", ...],
  "how_to_research": ["bullet 1", "bullet 2", ...],
  "key_kpis": [{{"metric": "name", "explanation": "why it matters"}}, ...]
}}

Company Data:
{data_summary}

Keep each bullet to 1-2 sentences. Be specific to this company, not generic.`,

  executive_summary: `Write a tight Executive Summary (2-3 paragraphs) for {company_name} ({ticker}).

Paragraph 1: What the company does at its core and why it's interesting to institutional investors RIGHT NOW.
Paragraph 2: The stock's current setup — valuation, sentiment, catalysts, and what the market is debating.
Paragraph 3: The critical question that determines whether this is a buy — frame it as the key debate/risk.

Company Data:
{data_summary}

Be specific with numbers. Write like a hedge fund PM who just read the 10-K and talked to the CFO.`,

  core_thesis: `Write the Core Thesis section for {company_name} ({ticker}).

Structure:
- 3-4 bullet points of the bull case thesis (what makes this a compelling long)
- 1-2 bullet points of the main debate/bear case
- A 1-sentence "Main Debate" conclusion

Data:
{data_summary}

Each bullet should be specific and data-anchored. Avoid clichés.`,

  business_model: `Explain What The Business Does for {company_name} ({ticker}).

Write 2 paragraphs:
1. Core business model — revenue model, customer base, product suite, go-to-market
2. Revenue quality — recurring vs. transactional, customer concentration, unit economics, expansion dynamics

Data:
{data_summary}

Be concise. Institutional investors reading this already know the company exists — give them what matters.`,

  industry_structure: `Write the Industry and Market Structure section for {company_name} ({ticker}).

Cover:
- Total addressable market and competitive dynamics
- Secular tailwinds and headwinds specific to this industry
- Where this company sits in the value chain
- What macro/sector factors matter most for the thesis

Keep it to 2-3 paragraphs. Be specific about the industry, not generic statements.

Data:
{data_summary}`,

  competitive_position: `Write the Competitive Position section for {company_name} ({ticker}).

Use this exact structure:
- Moat or lack of moat: [specific assessment]
- Pricing power: [specific assessment]
- Switching costs: [specific assessment]
- Scale advantages: [specific assessment]
- Key risks from competitors: [specific named competitors and threats]

Then write: "Judgment: [Strong/Moderate/Weak]" with a 1-sentence rationale.

Competitors to consider: {peers}

Data:
{data_summary}`,

  management: `Write the Management and Capital Allocation section for {company_name} ({ticker}).

Cover:
- Leadership quality and track record
- Capital allocation priorities (R&D spend, M&A history, buybacks, dividends)
- Incentive alignment (insider ownership, comp structure)
- Any red flags or notable track record items

Structure as 4-5 bullet points then: "Judgment: [Good/Mixed/Poor]"

Data:
{data_summary}`,

  financial_quality: `Write the Financial Quality section for {company_name} ({ticker}).

Cover these specific items:
- Revenue quality and growth trajectory
- Margin profile and path to profitability/margin expansion
- Free cash flow generation
- Returns on capital
- Balance sheet strength
- Key financial risks

Use the actual numbers from the data provided. Structure as 5-6 bullet points.

Data:
{data_summary}`,

  investment_judgment: `Write the final Investment Judgment & Key Risks section for {company_name} ({ticker}).

Structure:
1. OVERALL JUDGMENT: [Compelling Long / Interesting Watch / Too Early / Pass] with 2-sentence rationale
2. KEY RISKS (3-4 specific, named risks that could invalidate the thesis)
3. WHAT WOULD CHANGE OUR MIND (2-3 specific triggers — both positive and negative)
4. PRICE TARGET CONTEXT: Comment on current valuation vs. peers and implied return

This should read like the conclusion of an actual hedge fund investment memo.

Data:
{data_summary}`,
};

export const RESEARCH_CHECKLIST_PROMPTS: Record<string, string> = {
  research_guide: `Based on this company data, generate a LEFT PANEL research guide aligned to Jeremy's 
8-step due diligence process. Generate three sections:

1. WHAT REALLY MATTERS (3-5 bullet points about the core long-term quality factors for this business)
2. HOW TO RESEARCH IT PROPERLY (6-8 specific bullet points referencing primary sources: 10-K, conference 
   calls, investor presentations, quarterly filings — be specific to this company)
3. KEY KPIS TO TRACK (5-7 metrics a long-term investor should monitor quarterly)

Format as JSON with these exact keys:
{{
  "what_really_matters": ["bullet 1", "bullet 2", ...],
  "how_to_research": ["bullet 1", "bullet 2", ...],
  "key_kpis": [{{"metric": "name", "explanation": "why it matters for long-term holding"}}]
}}

Company Data:
{data_summary}

Make the research steps actionable — tell the investor exactly what to look for in each document.`,

  base_profile: `Write the Base Profile for {company_name} ({ticker}) — Step 1 of Jeremy's research process.

Answer three core questions clearly and concisely:
1. **What do they do?** — Core products/services in plain language, no jargon
2. **Who do they serve?** — Customer segments, end markets, geographic footprint
3. **Why does it matter?** — The problem they solve, their market position, and why this business is worth 
   owning for the long term

Write 3 focused paragraphs, one per question. Include key numbers (revenue scale, market share, customer count 
where available). This is the foundation — make it crystal clear.

Data:
{data_summary}`,

  investor_relations: `Analyze the Investor Relations / Annual Report (10-K) perspective for {company_name} ({ticker}) — Step 2.

Based on the available financial data, reconstruct the key insights a long-term investor would find in the 
company's 10-K and investor relations materials:

- **Business Model Clarity**: How does the company describe its revenue model and competitive advantage?
- **Risk Factors**: What are the most significant risks the company itself acknowledges?
- **Management Narrative**: How does management frame the long-term opportunity?
- **Capital Allocation Philosophy**: What does their spending on R&D, capex, and M&A reveal about priorities?
- **Where to Look**: Specific sections of the 10-K and IR page that matter most for this company

Write 4-5 focused bullet points plus a 1-paragraph "Key Takeaway" at the end.

Data:
{data_summary}`,

  conference_call: `Analyze the Conference Call perspective for {company_name} ({ticker}) — Step 3.

Based on management's track record, guidance, and how they discuss the business, assess:

- **Management Tone & Credibility**: Do they speak with conviction? Do they hedge excessively?
- **Strategy Clarity**: Is the long-term plan coherent and consistently communicated?
- **Handling Tough Questions**: How does management address analyst skepticism on key risks?
- **Guidance Track Record**: Are they beaters or misser? Conservative or optimistic?
- **Red Flags to Listen For**: Specific things to watch for in future calls for this company
- **Key Questions to Ask**: If you could ask management 3 questions, what would they be?

Write as 5-6 structured bullet points. Be direct about what management's behavior reveals about company quality.

Data:
{data_summary}`,

  quarterly_report: `Break down the Quarterly Report profile for {company_name} ({ticker}) — Step 4.

Analyze the financial trends as a long-term investor would when reviewing quarterly filings:

- **Revenue Trend**: Growth trajectory, acceleration or deceleration, seasonality
- **Margin Evolution**: Gross margin, operating margin — expanding, compressing, or stable?
- **Cash Flow Quality**: Is free cash flow growing? Is it higher or lower than net income (and why)?
- **Growth Drivers**: What's actually driving revenue — volume, price, new products, new markets?
- **Quarter-over-Quarter Watch**: What metrics should a long-term investor track each quarter?
- **Red Flags**: Any signs of deteriorating business quality in the numbers?

Use the actual financial data provided. Write as 5-6 structured bullet points.

Data:
{data_summary}`,

  investor_presentations: `Assess how {company_name} ({ticker}) positions itself to Wall Street — Step 5.

Based on the company's publicly stated strategy and financial data, analyze:

- **The Equity Story**: What is the core narrative management sells to institutional investors?
- **TAM & Growth Claims**: What market opportunity do they claim? Is it credible vs. reality?
- **Strategic Priorities**: What 3-5 initiatives does management highlight as key value drivers?
- **Positioning vs. Peers**: How do they differentiate themselves from {peers}?
- **What to Be Skeptical Of**: Where does the investor presentation likely oversell the story?
- **What Rings True**: Which parts of the narrative are well-supported by the numbers?

Write as 5-6 focused bullet points. Think like an investor who has seen hundreds of investor day presentations.

Peers: {peers}
Data:
{data_summary}`,

  news_analysis: `Analyze the News & Sentiment landscape for {company_name} ({ticker}) — Step 6.

Based on recent news and market context:

- **Recent Catalysts**: What events, announcements, or macro shifts have recently affected this stock?
- **Key Risks in the News**: What operational, regulatory, or competitive risks are being discussed?
- **Market Sentiment**: Is sentiment overly positive, overly negative, or fairly balanced?
- **Opportunities Emerging**: Any recent developments that could be positive long-term that the market is overlooking?
- **Opinions Worth Noting**: What are credible analysts or investors saying about this company?
- **Signal vs. Noise**: Which news stories actually matter for a long-term thesis vs. short-term noise?

Recent News Headlines:
{news_context}

Write as 5-6 structured bullet points. A long-term investor should not overreact to news — help calibrate signal from noise.

Data:
{data_summary}`,

  valuation: `Write the Valuation analysis for {company_name} ({ticker}) — Step 7 of Jeremy's process.

Compare price to earnings, growth, and other metrics to determine if this is a fair price for a long-term owner:

- **Current Valuation Multiples**: P/E (trailing & forward), EV/Revenue, EV/EBITDA, P/S — where does it trade?
- **Growth-Adjusted Value**: PEG ratio perspective — is the growth rate worth the multiple?
- **Historical Context**: Is the stock cheap or expensive relative to its own history?
- **Peer Comparison**: How do multiples compare to {peers}?
- **Analyst Price Targets**: Where is the consensus? What assumptions drive the bull/bear targets?
- **Long-Term Owner's Perspective**: At today's price, what return can a patient 5-year investor reasonably expect?

Use the actual valuation data provided. Write as 5-6 focused bullet points, ending with a clear valuation verdict.

Data:
{data_summary}`,

  share_statistics: `Write the Share Statistics section for {company_name} ({ticker}) — Step 8 (Final Step).

Analyze the ownership structure and key market statistics that a long-term investor must understand:

- **Market Cap & Float**: Total size of the company and tradeable shares
- **Insider Ownership**: What percentage do insiders own? Are they buying or selling?
- **Institutional Ownership**: What % of shares are held by institutions? Any notable fund holders?
- **Short Interest**: Short ratio and % of float short — what is the market betting against?
- **Forward P/E & Earnings Outlook**: Analyst consensus on near-term earnings trajectory
- **Dividend & Buyback Policy**: Is capital being returned to shareholders? At what rate?
- **Key Ratios Summary**: Quick-reference table of the most important share-level metrics

Write as 6-7 structured bullet points. End with a "Long-Term Investor Checklist" — a 3-point summary of 
whether the ownership structure and share dynamics support a long-term thesis.

Data:
{data_summary}`,
};

export const REPORT_SECTIONS_ORDER = [
  { id: "executive_summary", title: "Executive Summary" },
  { id: "core_thesis", title: "Core Thesis" },
  { id: "business_model", title: "What The Business Does" },
  { id: "industry_structure", title: "Industry & Market Structure" },
  { id: "competitive_position", title: "Competitive Position" },
  { id: "management", title: "Management & Capital Allocation" },
  { id: "financial_quality", title: "Financial Quality" },
  { id: "investment_judgment", title: "Investment Judgment & Key Risks" },
];

export const RESEARCH_CHECKLIST_SECTIONS_ORDER = [
  { id: "base_profile", title: "Base Profile" },
  { id: "investor_relations", title: "Investor Relations & 10-K" },
  { id: "conference_call", title: "Latest Conference Call" },
  { id: "quarterly_report", title: "Latest Quarterly Report" },
  { id: "investor_presentations", title: "Investor Presentations" },
  { id: "news_analysis", title: "News & Sentiment" },
  { id: "valuation", title: "Valuation" },
  { id: "share_statistics", title: "Share Statistics" },
];

export const WORKFLOW_SECTIONS: Record<string, typeof REPORT_SECTIONS_ORDER> = {
  hedge_fund: REPORT_SECTIONS_ORDER,
  research_checklist: RESEARCH_CHECKLIST_SECTIONS_ORDER,
};
