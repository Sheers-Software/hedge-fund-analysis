"use client";

import { useAppStore, useSettingsStore } from "@/lib/store";
import { X } from "lucide-react";

export default function SettingsModal() {
  const { isSettingsOpen, setSettingsOpen } = useAppStore();
  const { geminiKey, finnhubKey, setGeminiKey, setFinnhubKey } = useSettingsStore();

  if (!isSettingsOpen) return null;

  return (
    <div className="modal-overlay open">
      <div className="modal-box">
        <div className="modal-header">
          <h3 className="modal-title">API Configuration</h3>
          <button className="modal-close-btn" onClick={() => setSettingsOpen(false)}>
            <X size={18} />
          </button>
        </div>
        
        <p className="modal-subtitle">
          Keys are stored locally in your browser. No data is sent to our servers.
        </p>

        <div className="form-group">
          <label className="form-label">
            <span>Gemini API Key <span className="req">*</span></span>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">Get Key</a>
          </label>
          <input 
            type="password" 
            className="form-input" 
            placeholder="AIzaSy..." 
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
          />
          <div className="form-hint">Required for AI report generation</div>
        </div>

        <div className="form-group">
          <label className="form-label">
            <span>Finnhub API Key</span>
            <a href="https://finnhub.io/dashboard" target="_blank" rel="noreferrer">Get Key</a>
          </label>
          <input 
            type="password" 
            className="form-input" 
            placeholder="cq..." 
            value={finnhubKey}
            onChange={(e) => setFinnhubKey(e.target.value)}
          />
          <div className="form-hint">Optional: Enables richer search and metrics</div>
        </div>

        <div className="modal-note">
          <strong>Note:</strong> Generating reports takes ~15-20 seconds. 
          Use Chrome/Edge for best streaming performance.
        </div>

        <div className="modal-actions">
          <button className="btn-save" onClick={() => setSettingsOpen(false)}>
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
