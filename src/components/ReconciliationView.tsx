import React, { useState } from "react";
import { 
  RefreshCw, 
  ArrowRight, 
  Sparkles, 
  Check, 
  X, 
  HelpCircle, 
  Database, 
  Activity, 
  AlertTriangle
} from "lucide-react";
import { ReconciliationResult } from "../types";

interface ReconciliationViewProps {
  reconciliations: ReconciliationResult[];
  onReconcile: (id: string, status: "Approved" | "Ignored") => void;
  theme: "dark" | "light";
  activePeriod: string;
}

export default function ReconciliationView({
  reconciliations: reconciliationsProp,
  onReconcile,
  theme,
  activePeriod
}: ReconciliationViewProps) {
  const [selectedItem, setSelectedItem] = useState<ReconciliationResult | null>(null);

  // Filter reconciliations by active period
  const reconciliations = reconciliationsProp.filter(r => {
    if (r.period) return r.period === activePeriod;
    return activePeriod === "July 2026";
  });

  const isDark = theme === "dark";

  return (
    <div className="space-y-4" id="intelligent_reconcile_container">
      {/* Overview Status */}
      <div className={`p-3 rounded-md border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
        isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-[#0078D4]/10 text-[#0078D4]">
            <RefreshCw size={18} className="animate-spin [animation-duration:15s]" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-[#323130] dark:text-white">Intelligent Multi-System Reconciliation Engine</h2>
            <p className="text-[10.5px] text-slate-400 mt-0.5">
              Cross-comparing timesheets, attendance badges, and expense claims against HRMS employee contracts.
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <span className="text-[9px] text-[#605E5C] dark:text-slate-400 uppercase font-bold">Unresolved Variances</span>
            <p className="text-base font-extrabold text-[#C49B00] font-mono leading-none mt-1">
              {reconciliations.filter(r => r.status === "Pending").length}
            </p>
          </div>
          <div className="border-l border-slate-700/20 pl-4 text-center">
            <span className="text-[9px] text-[#605E5C] dark:text-slate-400 uppercase font-bold">Auto-Aligned Cases</span>
            <p className="text-base font-extrabold text-[#107C10] font-mono leading-none mt-1">
              {reconciliations.filter(r => r.status === "Approved").length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Comparison Ledger */}
        <div className="lg:col-span-2">
          <div className={`p-3.5 rounded-md border ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"}`}>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Database size={12} />
              Cross-System Discrepancy Ledger
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b ${isDark ? "border-[#2D2D2D] text-slate-400" : "border-[#EDEBE9] text-[#605E5C] font-semibold"}`}>
                    <th className="py-1.5 px-2 font-bold">Employee Details</th>
                    <th className="py-1.5 font-bold">Ingested Inbound</th>
                    <th className="py-1.5 font-bold">HRMS Master</th>
                    <th className="py-1.5 font-bold">Variance</th>
                    <th className="py-1.5 text-right font-bold">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {reconciliations.map((item) => (
                    <tr
                      key={item.id}
                      id={`rec_row_${item.id}`}
                      onClick={() => setSelectedItem(item)}
                      className={`border-b border-[#EDEBE9]/20 cursor-pointer transition-colors ${
                        selectedItem?.id === item.id 
                          ? (isDark ? "bg-[#2D2D2D]" : "bg-[#EFF6FC] font-semibold") 
                          : (isDark ? "hover:bg-[#2D2D2D]/40" : "hover:bg-[#F3F2F1]/40")
                      } ${item.status !== "Pending" ? "opacity-60" : ""}`}
                    >
                      <td className="py-2 px-2">
                        <div className="font-bold text-[#323130] dark:text-white">{item.name}</div>
                        <div className="text-[9.5px] text-slate-400 font-mono">{item.employeeId} | {item.type}</div>
                      </td>
                      <td className="py-2 text-slate-500 dark:text-slate-300 font-mono text-[11px]">{item.source}</td>
                      <td className="py-2 text-slate-500 dark:text-slate-300 font-mono text-[11px]">{item.target}</td>
                      <td className="py-2 text-[#A80000] font-bold text-[11px]">{item.discrepancy}</td>
                      <td className="py-2 text-right">
                        <span className="px-1.5 py-0.5 rounded text-[9.5px] bg-[#107C10]/10 text-[#107C10] font-bold">
                          {item.confidence}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="space-y-3">
          {selectedItem ? (
            <div className={`p-3.5 rounded-md border space-y-3 shadow-sm ${
              isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9]"
            }`} id="reconcile_action_card">
              <div className="flex items-center justify-between border-b border-[#EDEBE9]/50 pb-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">AI Reconciliation Suggestion</span>
                <span className="text-[9px] bg-[#107C10]/10 text-[#107C10] font-bold px-1.5 py-0.5 rounded">
                  {selectedItem.confidence}% Aligned
                </span>
              </div>

              <div>
                <h4 className="text-[10px] uppercase text-slate-400 font-bold">Employee Target</h4>
                <p className="text-xs font-bold text-[#323130] dark:text-white">{selectedItem.name}</p>
                <p className="text-[10.5px] text-slate-400 font-mono mt-0.5">{selectedItem.employeeId} | {selectedItem.type}</p>
              </div>

              {/* Side by side visual blocks */}
              <div className="grid grid-cols-2 gap-2 text-center my-1.5">
                <div className={`p-2 rounded border ${isDark ? "bg-[#2D2D2D]/30 border-[#2D2D2D]" : "bg-[#F3F2F1]/50 border-[#EDEBE9]"}`}>
                  <span className="text-[9px] text-[#605E5C] font-bold uppercase">Source File Value</span>
                  <p className="text-xs font-mono font-bold mt-1 text-[#A80000]">{selectedItem.source}</p>
                </div>
                <div className={`p-2 rounded border ${isDark ? "bg-[#2D2D2D]/30 border-[#2D2D2D]" : "bg-[#F3F2F1]/50 border-[#EDEBE9]"}`}>
                  <span className="text-[9px] text-[#605E5C] font-bold uppercase">Contract Master</span>
                  <p className="text-xs font-mono font-bold mt-1 text-[#107C10]">{selectedItem.target}</p>
                </div>
              </div>

              <div className="p-2.5 bg-slate-500/5 rounded border border-[#0078D4]/10 text-xs">
                <h5 className="font-bold text-[#0078D4] flex items-center gap-1 mb-1">
                  <Sparkles size={10} className="animate-pulse" />
                  AI Corrective Decision
                </h5>
                <p className="text-[10.5px] text-slate-600 dark:text-slate-300 leading-normal">{selectedItem.aiRecommendation}</p>
              </div>

              {selectedItem.status === "Pending" ? (
                <div className="grid grid-cols-2 gap-2 pt-1.5">
                  <button
                    onClick={() => {
                      onReconcile(selectedItem.id, "Ignored");
                      setSelectedItem(null);
                    }}
                    id="btn_ignore_reconciliation"
                    className={`px-2 py-1 border rounded text-[11px] font-bold transition ${
                      isDark ? "border-[#2D2D2D] hover:bg-[#2D2D2D] text-slate-300" : "border-[#EDEBE9] hover:bg-[#F3F2F1] text-[#323130]"
                    }`}
                  >
                    Bypass Discrepancy
                  </button>
                  <button
                    onClick={() => {
                      onReconcile(selectedItem.id, "Approved");
                      setSelectedItem(null);
                    }}
                    id="btn_approve_reconciliation"
                    className="px-2 py-1 bg-[#107C10] hover:bg-[#0B5A0B] text-white rounded text-[11px] font-bold transition shadow-sm flex items-center justify-center gap-1"
                  >
                    <Check size={11} /> Approve AI Adjustment
                  </button>
                </div>
              ) : (
                <div className="p-2.5 bg-[#107C10]/10 border border-[#107C10]/20 text-[#107C10] rounded text-center font-bold text-[11px]">
                  ✓ Adjustments successfully posted to global ledger ({selectedItem.status})
                </div>
              )}
            </div>
          ) : (
            <div className={`p-4 rounded-md border text-center py-8 ${
              isDark ? "bg-[#1F1F1F] border-[#2D2D2D] text-slate-400" : "bg-white border-[#EDEBE9] text-slate-500 shadow-sm"
            }`}>
              <HelpCircle className="mx-auto mb-1.5 text-slate-400" size={20} />
              <h4 className="text-xs font-bold text-[#323130] dark:text-white">No Discrepancy Selected</h4>
              <p className="text-[10.5px] text-slate-400 mt-1 leading-normal">
                Select any discrepancy row in the ledger to parse details, review active card badge logs, and approve retroactive adjustments.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
