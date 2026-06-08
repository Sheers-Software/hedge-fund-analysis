"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronDown } from "lucide-react";

export interface ReportSectionData {
  id: string;
  title: string;
  status: "idle" | "loading" | "done" | "error";
  content: string;
}

export default function SectionCard({ 
  section, 
  index,
  workflow
}: { 
  section: ReportSectionData; 
  index: number;
  workflow: string;
}) {
  const [expanded, setExpanded] = useState(true);

  if (section.status === "idle") return null;

  const isRC = workflow === "research_checklist";

  return (
    <div className={`report-section ${isRC ? 'wf-rc' : 'wf-hf'}`}>
      <div
        className="section-header"
        onClick={() => setExpanded(!expanded)}
        role="button"
        aria-expanded={expanded}
      >
        <div className="section-number">{index + 1}</div>
        <div className="section-title-text">{section.title}</div>
        <div className={`section-status ${section.status}`} />
        <ChevronDown size={15} className={`section-chevron ${expanded ? "open" : ""}`} />
      </div>

      {expanded && (
        <div className="section-body">
          <div className="section-prose">
            <ReactMarkdown>{section.content}</ReactMarkdown>
            {section.status === "loading" && <span className="typing-cursor" />}
          </div>
        </div>
      )}
    </div>
  );
}
