"use client";

import { useEffect, useState, use } from "react";
import { useAppStore, useSettingsStore, useReportStore } from "@/lib/store";
import { WORKFLOW_SECTIONS } from "@/lib/prompts";
import CompanyHeader from "@/components/ui/CompanyHeader";
import FinancialMetrics from "@/components/ui/FinancialMetrics";
import MandatoryMetrics from "@/components/ui/MandatoryMetrics";
import NewsFeed from "@/components/ui/NewsFeed";
import SectionCard, { ReportSectionData } from "@/components/ui/SectionCard";
import Sidebar from "@/components/layout/Sidebar";
import { Download, Printer } from "lucide-react";
import { CompanyData } from "@/lib/types";

export default function ReportPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker: encodedTicker } = use(params);
  const ticker = decodeURIComponent(encodedTicker).toUpperCase();

  const { geminiKey, finnhubKey } = useSettingsStore();
  const { setCurrentTicker, setSettingsOpen, researchGuide, setResearchGuide } = useAppStore();

  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const workflow = "hedge_fund";
  const [sections, setSections] = useState<ReportSectionData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [genError, setGenError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentTicker(ticker);
    // Restore a previously generated report for this ticker (persisted across
    // navigation between features), otherwise start clean.
    const cached = useReportStore.getState().reports[ticker];
    if (cached) {
      setSections(cached.sections);
      setResearchGuide(cached.researchGuide || null);
    } else {
      setSections([]);
      setResearchGuide(null);
    }
    fetchData();
  }, [ticker]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const res = await fetch(`/api/quote/${ticker}`, {
        headers: { "x-finnhub-key": finnhubKey }
      });
      const data = await res.json();
      setCompanyData(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingData(false);
    }
  };

  const generateReport = async () => {
    if (!companyData) return;

    setResearchGuide(null);
    setGenError(null);
    setIsGenerating(true);
    setProgress(5);

    const initialSections = (WORKFLOW_SECTIONS[workflow] || WORKFLOW_SECTIONS.hedge_fund).map(s => ({
      ...s,
      status: "idle" as const,
      content: ""
    }));
    setSections(initialSections);

    // Track the latest state locally so we can persist it as it streams,
    // keeping the report saved even if the user switches features mid-way.
    let liveSections: ReportSectionData[] = initialSections;
    let liveGuide: any = null;
    const persistReport = () =>
      useReportStore.getState().saveReport(ticker, {
        sections: liveSections,
        researchGuide: liveGuide,
        generatedAt: Date.now(),
      });

    try {
      const res = await fetch(`/api/report/${ticker}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(geminiKey ? { "Authorization": `Bearer ${geminiKey}` } : {})
        },
        body: JSON.stringify({ workflow, data: companyData })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setGenError(
            (body.error || "Missing Gemini API Key") +
              ". Add your Gemini key in Settings, or set GEMINI_API_KEY in the server environment (Vercel → Project → Settings → Environment Variables)."
          );
          setSettingsOpen(true);
        } else {
          setGenError(body.error || `Generation failed (HTTP ${res.status}).`);
        }
        setIsGenerating(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let currentSectionId = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const events = chunk.split("\n\n");

          for (const ev of events) {
            if (!ev.trim()) continue;
            const lines = ev.split("\n");
            const eventType = lines[0].replace("event: ", "").trim();
            const eventDataStr = lines[1]?.replace("data: ", "").trim();
            
            if (!eventDataStr) continue;

            try {
              const data = JSON.parse(eventDataStr);

              if (eventType === "research_guide") {
                liveGuide = data;
                setResearchGuide(data);
                setProgress(15);
                persistReport();
              } else if (eventType === "section_start") {
                currentSectionId = data.section;
                liveSections = liveSections.map(s =>
                  s.id === data.section ? { ...s, status: "loading" } : s
                );
                setSections(liveSections);
              } else if (eventType === "section_chunk") {
                liveSections = liveSections.map(s =>
                  s.id === currentSectionId ? { ...s, content: s.content + data.text } : s
                );
                setSections(liveSections);
              } else if (eventType === "section_end") {
                liveSections = liveSections.map(s =>
                  s.id === data.section ? { ...s, status: "done" } : s
                );
                setSections(liveSections);
                const idx = liveSections.findIndex(s => s.id === data.section);
                setProgress(15 + Math.floor(((idx + 1) / liveSections.length) * 85));
                persistReport(); // save after each completed section
              } else if (eventType === "done") {
                setProgress(100);
                setIsGenerating(false);
                persistReport();
              } else if (eventType === "error") {
                console.error("SSE Error:", data.message);
                setGenError(data.message || "The AI engine returned an error.");
                setIsGenerating(false);
              }
            } catch (e) {
              console.error("Failed to parse SSE event:", e, eventDataStr);
            }
          }
        }
      }
    } catch (e: any) {
      console.error(e);
      setGenError(e.message || "Network error while contacting the AI engine.");
      setIsGenerating(false);
    }
  };

  const handleExport = () => {
    let md = `# ApexAlpha Research Report: ${ticker}\n\n`;
    sections.forEach((s, i) => {
      if (s.content) {
        md += `## ${i+1}. ${s.title}\n\n${s.content}\n\n---\n\n`;
      }
    });
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${ticker}_Research_Report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPdf = () => {
    const prevTitle = document.title;
    // The browser's "Save as PDF" uses the document title as the default filename.
    document.title = `${ticker}_Research_Report`;
    const restore = () => {
      document.title = prevTitle;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  };

  if (loadingData) {
    return (
      <main className="main-content">
        <div className="skeleton mb-4" style={{ height: "120px" }} />
        <div className="skeleton mb-4" style={{ height: "80px" }} />
        <div className="skeleton" style={{ height: "300px" }} />
      </main>
    );
  }

  if (error || !companyData) {
    return (
      <main className="main-content flex items-center justify-center">
        <div className="text-center text-[#f43f5e]">
          <h2>Failed to load data for {ticker}</h2>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <Sidebar>
        {researchGuide ? (
          <div className="flex flex-col gap-4">
            {researchGuide.what_really_matters && (
              <div className="guide-section">
                <div className="guide-section-title">What Really Matters</div>
                <ul className="guide-list">
                  {researchGuide.what_really_matters.map((b: string, i: number) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            )}
            {researchGuide.how_to_research && (
              <div className="guide-section">
                <div className="guide-section-title">How To Research</div>
                <ul className="guide-list">
                  {researchGuide.how_to_research.map((b: string, i: number) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            )}
            {researchGuide.key_kpis && (
              <div className="guide-section">
                <div className="guide-section-title">Key KPIs to Track</div>
                <div>
                  {researchGuide.key_kpis.map((kpi: any, i: number) => (
                    <div key={i} className="kpi-item">
                      <div className="kpi-name">{kpi.metric}</div>
                      <div className="kpi-desc">{kpi.explanation}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="sidebar-empty">
            Generate a report to see the AI-generated research guide and key KPIs to track.
          </div>
        )}
      </Sidebar>
      <main className="main-content">
        <div className="print-only print-cover">
          <div className="print-cover-brand">
            Apex<span>Alpha</span>
            <span className="print-cover-pro">EQUITY RESEARCH</span>
          </div>
          <h1 className="print-cover-company">
            {companyData.info?.longName || ticker}{" "}
            <span className="print-cover-ticker">({ticker})</span>
          </h1>
          <div className="print-cover-meta">
            {companyData.info?.sector && <span>{companyData.info.sector}</span>}
            {companyData.info?.exchange && <span>{companyData.info.exchange}</span>}
            <span>
              Price: $
              {companyData.real_time_quote?.current ??
                companyData.financials?.current_price ??
                "—"}
            </span>
            {companyData.financials?.market_cap_formatted && (
              <span>Mkt Cap: {companyData.financials.market_cap_formatted}</span>
            )}
          </div>
          <div className="print-cover-date">
            Generated{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            · Powered by Gemini 2.5 Flash
          </div>
        </div>

        {companyData.error && (
          <div className="no-print bg-orange-900/40 border border-orange-500/50 text-orange-200 p-4 rounded-lg mb-6 text-sm">
            <strong>Data Fetch Warning:</strong> Yahoo Finance data is blocked by Vercel. Add a free Finnhub API Key in Settings to restore real-time financial data. The AI will still attempt to generate a report using its internal knowledge!
          </div>
        )}
        <CompanyHeader data={companyData} />
        <FinancialMetrics data={companyData} />
        <MandatoryMetrics data={companyData} />
        <NewsFeed data={companyData} />

        <div className="report-header-bar">
          <div>
            <div className="report-title-text">AI RESEARCH REPORT</div>
            <div className="report-subtitle">Generated by Gemini 2.5 Flash</div>
          </div>

          <div className="report-actions mt-2 md:mt-0">
            {sections.some(s => s.status === "done") && (
              <>
                <button className="export-btn" onClick={handlePrintPdf}>
                  <Printer size={14} /> Export PDF
                </button>
                <button className="export-btn" onClick={handleExport}>
                  <Download size={14} /> Export MD
                </button>
              </>
            )}
            <button 
              className="btn-save !px-4 !py-1.5 ml-2" 
              onClick={generateReport}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>

        {genError && (
          <div className="no-print bg-red-900/40 border border-red-500/50 text-red-200 p-4 rounded-lg my-4 text-sm">
            <strong>Report generation failed:</strong> {genError}
          </div>
        )}

        {isGenerating && progress < 100 && (
          <div className="progress-bar-wrapper no-print">
            <div className="progress-label">
              <span>Generating Intelligence...</span>
              <span>{progress}%</span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="sections-container">
          {sections.map((sec, i) => (
            <SectionCard key={sec.id} section={sec} index={i} workflow={workflow} />
          ))}
        </div>

        {sections.some(s => s.status === "done") && (
          <div className="print-only print-footer">
            <strong>Disclaimer:</strong> This report is AI-generated for informational
            purposes only and does not constitute financial advice, an offer, or a
            solicitation to buy or sell any security. Figures are sourced from
            third-party providers and may be delayed or inaccurate. Verify
            independently before making investment decisions.
            <div className="print-footer-brand">
              ApexAlpha · Equity Research · Confidential
            </div>
          </div>
        )}
      </main>
    </>
  );
}
