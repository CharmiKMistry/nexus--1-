import React, { useState } from "react";
import { 
  ShieldAlert, 
  Check, 
  CheckCircle,
  X, 
  HelpCircle, 
  Sparkles, 
  ChevronRight,
  TrendingUp,
  AlertOctagon,
  Clock,
  ArrowRight
} from "lucide-react";
import { ValidationResult } from "../types";

interface ValidationViewProps {
  validations: ValidationResult[];
  onResolve: (id: string, action: "Resolved" | "Ignored") => void;
  theme: "dark" | "light";
  activePeriod: string;
}

export default function ValidationView({
  validations: validationsProp,
  onResolve,
  theme,
  activePeriod
}: ValidationViewProps) {
  const [selectedIssue, setSelectedIssue] = useState<ValidationResult | null>(null);

  // Filter validations by active period
  const validations = validationsProp.filter(v => {
    if (v.period) return v.period === activePeriod;
    return activePeriod === "July 2026";
  });

  const getSeverityBadge = (sev: "High" | "Medium" | "Low") => {
    switch (sev) {
      case "High":
        return "bg-[#A80000]/10 text-[#A80000] border border-[#A80000]/25";
      case "Medium":
        return "bg-[#C49B00]/10 text-[#C49B00] border border-[#C49B00]/25";
      case "Low":
        return "bg-[#0078D4]/10 text-[#0078D4] border border-[#0078D4]/25";
    }
  };

  const isDark = theme === "dark";

  return (
    <div className="space-y-4" id="ai_validation_container">
      {/* Header Stat Panel */}
      <div className={`p-3 rounded-md border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
        isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-[#A80000]/10 text-[#A80000]">
            <ShieldAlert size={18} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-[#323130] dark:text-white">AI Validation Scanning Deck</h2>
            <p className="text-[10.5px] text-slate-400 mt-0.5">
              Active anomalies detected across 1,420 employee records under July 2026 payroll cycles.
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <span className="text-[9px] text-[#605E5C] dark:text-slate-400 uppercase font-bold">Severe Risks</span>
            <p className="text-base font-extrabold text-[#A80000] font-mono leading-none mt-1">
              {validations.filter(v => v.severity === "High" && v.status === "Pending").length}
            </p>
          </div>
          <div className="border-l border-slate-700/20 pl-4 text-center">
            <span className="text-[9px] text-[#605E5C] dark:text-slate-400 uppercase font-bold">Medium Risks</span>
            <p className="text-base font-extrabold text-[#C49B00] font-mono leading-none mt-1">
              {validations.filter(v => v.severity === "Medium" && v.status === "Pending").length}
            </p>
          </div>
          <div className="border-l border-slate-700/20 pl-4 text-center">
            <span className="text-[9px] text-[#605E5C] dark:text-slate-400 uppercase font-bold">Resolved Cases</span>
            <p className="text-base font-extrabold text-[#107C10] font-mono leading-none mt-1">
              {validations.filter(v => v.status === "Resolved").length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Validations List */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Anomalies Queue</h3>
            <span className="text-[10px] text-slate-400">Sort: Confidence (High-to-Low)</span>
          </div>

          {validations.length === 0 ? (
            <div className={`p-6 rounded-md text-center border ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"}`}>
              <CheckCircle className="text-[#107C10] mx-auto mb-2" size={24} />
              <h4 className="text-xs font-bold text-[#323130] dark:text-white">All Validation Anomalies Cleared!</h4>
              <p className="text-[11px] text-slate-400 mt-1">Excellent job. The global readiness scorecard has hit 100%.</p>
            </div>
          ) : (
            validations.map((v) => (
              <div 
                key={v.id}
                id={`val_item_${v.id}`}
                onClick={() => setSelectedIssue(v)}
                className={`p-3 rounded-md border transition-all cursor-pointer ${
                  selectedIssue?.id === v.id
                    ? (isDark ? "bg-[#2D2D2D] border-[#0078D4]" : "bg-[#EFF6FC] border-[#0078D4]")
                    : (isDark ? "bg-[#1F1F1F] border-[#2D2D2D] hover:border-slate-500" : "bg-white border-[#EDEBE9] hover:border-slate-300 shadow-sm")
                } ${v.status !== "Pending" ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#323130] dark:text-white">{v.employeeName}</span>
                    <span className="text-[10px] font-mono text-slate-400">({v.employeeId})</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${getSeverityBadge(v.severity)}`}>
                      {v.severity}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9.5px] bg-[#107C10]/10 text-[#107C10] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Sparkles size={9} /> {v.confidenceScore}% Confidence
                    </span>
                    {v.status !== "Pending" && (
                      <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${
                        v.status === "Resolved" ? "bg-[#107C10]/10 text-[#107C10]" : "bg-slate-500/10 text-slate-400"
                      }`}>
                        {v.status}
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="text-xs font-bold text-[#0078D4] mt-1.5 flex items-center gap-1">
                  <AlertOctagon size={11} className="text-[#0078D4]" />
                  {v.issueType} — {v.country}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-normal">{v.explanation}</p>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/10">
                  <span className="text-[9.5px] text-slate-400 flex items-center gap-1">
                    <Clock size={10} /> Ingestion: July Inbound Feed
                  </span>
                  <span className="text-[10.5px] text-[#0078D4] hover:underline font-bold flex items-center gap-0.5">
                    Inspect details <ChevronRight size={11} />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Issue Inspector */}
        <div className="space-y-3">
          {selectedIssue ? (
            <div className={`p-3.5 rounded-md border space-y-3 sticky top-4 shadow-sm ${
              isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9]"
            }`} id="val_inspector_panel">
              <div className="flex items-center justify-between border-b border-slate-700/10 pb-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">AI Insight Inspector</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${getSeverityBadge(selectedIssue.severity)}`}>
                  {selectedIssue.severity}
                </span>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase">Employee Profile</h4>
                <p className="text-xs font-bold mt-0.5 text-[#323130] dark:text-white">{selectedIssue.employeeName}</p>
                <p className="text-[10.5px] text-slate-400 mt-0.5">ID: {selectedIssue.employeeId} | Country: {selectedIssue.country}</p>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase">Statutory Exception Category</h4>
                <p className="text-xs font-bold text-[#A80000] mt-0.5">{selectedIssue.issueType}</p>
              </div>

              <div className="p-2.5 rounded bg-slate-500/5 border border-slate-700/10">
                <h4 className="text-[10px] font-bold text-[#0078D4] flex items-center gap-1 mb-1">
                  <Sparkles size={10} /> Copilot Statutory Explanation
                </h4>
                <p className="text-[10.5px] text-slate-600 dark:text-slate-300 leading-normal">{selectedIssue.explanation}</p>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-[#107C10] flex items-center gap-1 mb-1">
                  <Check size={10} /> Recommended Resolution
                </h4>
                <p className="text-[10.5px] text-slate-600 dark:text-slate-300 leading-normal">{selectedIssue.recommendedResolution}</p>
              </div>

              {selectedIssue.status === "Pending" ? (
                <div className="grid grid-cols-2 gap-2 pt-1.5">
                  <button
                    onClick={() => {
                      onResolve(selectedIssue.id, "Ignored");
                      setSelectedIssue(null);
                    }}
                    id="btn_ignore_anomaly"
                    className={`px-2 py-1 border rounded text-[11px] font-bold transition ${
                      isDark ? "border-[#2D2D2D] hover:bg-[#2D2D2D] text-slate-300" : "border-[#EDEBE9] hover:bg-[#F3F2F1] text-[#323130]"
                    }`}
                  >
                    Bypass Flag
                  </button>
                  <button
                    onClick={() => {
                      onResolve(selectedIssue.id, "Resolved");
                      setSelectedIssue(null);
                    }}
                    id="btn_resolve_anomaly"
                    className="px-2 py-1 bg-[#107C10] hover:bg-[#0B5A0B] text-white rounded text-[11px] font-bold transition shadow-sm flex items-center justify-center gap-1"
                  >
                    <Check size={11} /> Apply Resolution
                  </button>
                </div>
              ) : (
                <div className="p-2.5 bg-[#107C10]/10 border border-[#107C10]/20 text-[#107C10] rounded text-center font-bold text-[11px]">
                  ✓ This issue was successfully {selectedIssue.status.toLowerCase()}!
                </div>
              )}
            </div>
          ) : (
            <div className={`p-4 rounded-md border text-center py-8 ${
              isDark ? "bg-[#1F1F1F] border-[#2D2D2D] text-slate-400" : "bg-white border-[#EDEBE9] text-slate-500 shadow-sm"
            }`}>
              <HelpCircle className="mx-auto mb-1.5 text-slate-400" size={20} />
              <h4 className="text-xs font-bold text-[#323130] dark:text-white">No Anomaly Selected</h4>
              <p className="text-[10.5px] text-slate-400 mt-1 leading-normal">
                Select any validation item in the queue to load the NEXUS AI statutory explanation, legal references, and resolve immediately.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
