"use client";

import { useEffect, useState, use } from "react";
import { useAppStore, useSettingsStore } from "@/lib/store";
import { WORKFLOW_SECTIONS } from "@/lib/prompts";
import CompanyHeader from "@/components/ui/CompanyHeader";
import FinancialMetrics from "@/components/ui/FinancialMetrics";
import NewsFeed from "@/components/ui/NewsFeed";
import SectionCard, { ReportSectionData } from "@/components/ui/SectionCard";
import Sidebar from "@/components/layout/Sidebar";
import { Download } from "lucide-react";
import { CompanyData } from "@/lib/types";

export default function ReportPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker: encodedTicker } = use(params);
  const ticker = decodeURIComponent(encodedTicker).toUpperCase();

  const { geminiKey, finnhubKey } = useSettingsStore();
  const { setCurrentTicker, setSettingsOpen, researchGuide, setResearchGuide } = useAppStore();

  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [workflow, setWorkflow] = useState("hedge_fund");
  const [sections, setSections] = useState<ReportSectionData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setCurrentTicker(ticker);
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
    setIsGenerating(true);
    setProgress(5);

    const initialSections = (WORKFLOW_SECTIONS[workflow] || WORKFLOW_SECTIONS.hedge_fund).map(s => ({
      ...s,
      status: "idle" as const,
      content: ""
    }));
    setSections(initialSections);

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
        if (res.status === 401) setSettingsOpen(true);
        throw new Error("Failed to start generation");
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
                setResearchGuide(data);
                setProgress(15);
              } else if (eventType === "section_start") {
                currentSectionId = data.section;
                setSections(prev => prev.map(s => 
                  s.id === data.section ? { ...s, status: "loading" } : s
                ));
              } else if (eventType === "section_chunk") {
                setSections(prev => prev.map(s => 
                  s.id === currentSectionId ? { ...s, content: s.content + data.text } : s
                ));
              } else if (eventType === "section_end") {
                setSections(prev => {
                  const idx = prev.findIndex(s => s.id === data.section);
                  const newProg = 15 + Math.floor(((idx + 1) / prev.length) * 85);
                  setProgress(newProg);
                  return prev.map(s => 
                    s.id === data.section ? { ...s, status: "done" } : s
                  );
                });
              } else if (eventType === "done") {
                setProgress(100);
                setIsGenerating(false);
              } else if (eventType === "error") {
                console.error("SSE Error:", data.message);
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
        {companyData.error && (
          <div className="bg-orange-900/40 border border-orange-500/50 text-orange-200 p-4 rounded-lg mb-6 text-sm">
            <strong>Data Fetch Warning:</strong> Yahoo Finance data is blocked by Vercel. Add a free Finnhub API Key in Settings to restore real-time financial data. The AI will still attempt to generate a report using its internal knowledge!
          </div>
        )}
        <CompanyHeader data={companyData} />
        <FinancialMetrics data={companyData} />
        <NewsFeed data={companyData} />

        <div className="report-header-bar">
          <div>
            <div className="report-title-text">AI RESEARCH REPORT</div>
            <div className="report-subtitle">Generated by Gemini 2.5 Flash</div>
          </div>

          <div className="mode-selector max-w-[400px] mb-0 ml-auto mr-4 hidden md:grid !gap-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div 
              className={`mode-card !p-2 !gap-1 ${workflow === "hedge_fund" ? "active" : ""}`}
              onClick={() => setWorkflow("hedge_fund")}
            >
              <div className="mode-card-title !text-xs text-center">Hedge Fund</div>
            </div>
            <div 
              className={`mode-card mode-rc !p-2 !gap-1 ${workflow === "research_checklist" ? "active" : ""}`}
              onClick={() => setWorkflow("research_checklist")}
            >
              <div className="mode-card-title !text-xs text-center text-[#f59e0b]">Checklist</div>
            </div>
          </div>

          <div className="report-actions mt-2 md:mt-0">
            {sections.some(s => s.status === "done") && (
              <button className="export-btn" onClick={handleExport}>
                <Download size={14} /> Export MD
              </button>
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

        {isGenerating && progress < 100 && (
          <div className="progress-bar-wrapper">
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
      </main>
    </>
  );
}
