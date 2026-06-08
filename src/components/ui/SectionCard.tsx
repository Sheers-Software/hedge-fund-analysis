"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

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
      <div className="section-header" onClick={() => setExpanded(!expanded)}>
        <div className="section-number">{index + 1}</div>
        <div className="section-title-text">{section.title}</div>
        <div className={`section-status ${section.status}`} />
      </div>
      
      {expanded && (
        <div className="section-body">
          <ReactMarkdown
            components={{
              p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4" {...props} />,
              li: ({node, ...props}) => <li className="mb-2" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-sm font-bold text-[#e8edf2] mt-4 mb-2 uppercase" {...props} />,
              strong: ({node, ...props}) => <strong className="text-[#e8edf2] font-semibold" {...props} />
            }}
          >
            {section.content}
          </ReactMarkdown>
          {section.status === "loading" && <span className="typing-cursor" />}
        </div>
      )}
    </div>
  );
}
