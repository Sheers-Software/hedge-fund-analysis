"use client";

import { CompanyData } from "@/lib/types";

export default function NewsFeed({ data }: { data: CompanyData }) {
  const news = data.news || [];

  if (news.length === 0) return null;

  return (
    <div className="news-strip">
      <div className="news-strip-title">Recent Catalysts & News</div>
      <div className="news-items">
        {news.slice(0, 3).map((item, i) => (
          <div key={i} className="news-item">
            <div className="news-date">{item.datetime}</div>
            <div>
              <div className="news-headline">{item.headline}</div>
              <div className="news-source">{item.source}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
