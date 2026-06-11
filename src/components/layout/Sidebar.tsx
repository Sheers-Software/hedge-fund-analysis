"use client";

import { useAppStore } from "@/lib/store";
import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar({ children }: { children?: React.ReactNode }) {
  const { isSidebarOpen, setSidebarOpen } = useAppStore();
  const pathname = usePathname();

  return (
    <>
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside className={`sidebar ${isSidebarOpen ? "mobile-open" : "collapsed md:collapsed"}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">
            {pathname.includes("/valuation") ? "Calculator Params" : "Research Guide"}
          </span>
          <button className="sidebar-close md:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <div className="sidebar-body">
          {children ? children : (
            <div className="sidebar-empty">
              <div>Generate a report to see research guide.</div>
              <div className="flex gap-2 justify-center mt-4 md:hidden">
                <Link href="/app" className="text-xs text-blue-500 underline" onClick={() => setSidebarOpen(false)}>Research Hub</Link>
                <Link href="/valuation" className="text-xs text-blue-500 underline" onClick={() => setSidebarOpen(false)}>Valuation</Link>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
