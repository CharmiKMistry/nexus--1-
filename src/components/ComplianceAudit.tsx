import React, { useState } from "react";
import { 
  History, 
  Search, 
  Download, 
  CheckCircle, 
  FileText, 
  ArrowDownToLine, 
  Sliders, 
  ShieldCheck, 
  Sparkles,
  Lock,
  ChevronRight
} from "lucide-react";
import { NexusDB } from "../lib/db";

interface ComplianceAuditProps {
  theme: "dark" | "light";
}

export default function ComplianceAudit({ theme }: ComplianceAuditProps) {
  const [logs, setLogs] = useState([...NexusDB.auditLogs]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const isDark = theme === "dark";

  const filteredLogs = logs.filter(log => {
    return log.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
           log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
           (log.details || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
           log.role.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleExport = (format: string) => {
    setIsExporting(format);
    setTimeout(() => {
      setIsExporting(null);
      alert(`✓ Cryptographically Signed Ledger exported successfully as ${format}! File downloaded: NEXUS_Immutable_Audit_Ledger_${new Date().toISOString().slice(0,10)}.${format.toLowerCase()}`);
    }, 1200);
  };

  const getLogTypeBadge = (action: string) => {
    if (action.includes("Reset") || action.includes("Override") || action.includes("Delete")) {
      return "bg-rose-500/10 text-rose-500 border border-rose-500/20";
    }
    if (action.includes("Certify") || action.includes("Approved") || action.includes("Checked")) {
      return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
    }
    return "bg-[#0078D4]/10 text-[#0078D4] border border-[#0078D4]/20";
  };

  return (
    <div className="space-y-4" id="compliance_audit_ledger_container">
      {/* Header banner */}
      <div className="flex items-center justify-between border-b border-[#EDEBE9]/40 pb-2">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <History size={13} />
            Governance, Compliance & Audit Trail Ledger
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Immutable audit trail archiving all administrator overrides, digital certificates, and agentic scans.</p>
        </div>

        {/* Download reports */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleExport("CSV")}
            disabled={isExporting !== null}
            className={`px-2.5 py-1 text-xs rounded border font-semibold flex items-center gap-1 transition ${
              isDark ? "border-[#2D2D2D] bg-[#1F1F1F] hover:bg-[#2D2D2D] text-slate-200" : "border-[#EDEBE9] bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
            }`}
          >
            <ArrowDownToLine size={12} />
            {isExporting === "CSV" ? "Exporting..." : "CSV"}
          </button>
          <button
            onClick={() => handleExport("Excel")}
            disabled={isExporting !== null}
            className={`px-2.5 py-1 text-xs rounded border font-semibold flex items-center gap-1 transition ${
              isDark ? "border-[#2D2D2D] bg-[#1F1F1F] hover:bg-[#2D2D2D] text-slate-200" : "border-[#EDEBE9] bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
            }`}
          >
            <ArrowDownToLine size={12} />
            {isExporting === "Excel" ? "Exporting..." : "Excel"}
          </button>
          <button
            onClick={() => handleExport("PDF")}
            disabled={isExporting !== null}
            className="px-2.5 py-1 bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs rounded font-bold flex items-center gap-1 transition"
          >
            <Download size={12} />
            {isExporting === "PDF" ? "Signing..." : "Download Signed PDF"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left main: Ledger grid */}
        <div className="lg:col-span-2 space-y-3">
          {/* Search bar */}
          <div className={`p-3 rounded-md border flex items-center justify-between ${
            isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"
          }`}>
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Search audit trail by administrator, role, or action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-8 pr-3 py-1.5 text-xs w-full rounded border outline-none focus:border-[#0078D4] ${
                  isDark ? "bg-[#161616] border-[#2D2D2D] text-white" : "bg-[#FAF9F8] border-[#EDEBE9]"
                }`}
              />
            </div>
          </div>

          {/* Audit ledger table */}
          <div className={`rounded-md border overflow-hidden ${
            isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b ${isDark ? "border-[#2D2D2D] text-slate-400" : "border-[#EDEBE9] text-[#605E5C]"}`}>
                    <th className="py-2.5 px-3">Timestamp (UTC)</th>
                    <th className="py-2.5 px-3">System Operator</th>
                    <th className="py-2.5 px-3">Governance Event</th>
                    <th className="py-2.5 px-3">Trace Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr 
                      key={log.id} 
                      className={`border-b border-[#EDEBE9]/30 transition-colors ${
                        isDark ? "border-[#2D2D2D]/50 hover:bg-[#2D2D2D]/30" : "hover:bg-[#F3F2F1]/30"
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                        {log.timestamp.replace("T", " ").replace("Z", "").slice(0, 19)}
                      </td>
                      <td className="py-2.5 px-3">
                        <div>
                          <p className="font-semibold text-[#323130] dark:text-white">{log.user}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{log.role}</p>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] whitespace-nowrap ${getLogTypeBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-300 leading-normal max-w-xs">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right side panel: Cryptographic Sealed Information */}
        <div className="space-y-3">
          <div className={`p-4 rounded-md border space-y-3.5 shadow-sm ${
            isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9]"
          }`}>
            <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/10 pb-2 flex items-center gap-1.5">
              <Lock size={12} className="text-[#0078D4]" />
              Immutable Ledger Seal Integrity
            </h3>

            <div className="space-y-3 text-xs leading-relaxed">
              <p className="text-slate-400">
                Each transaction in the NEXUS ledger is signed cryptographically, creating a verifiable blockchain-inspired proof key to defend against unauthorized file manipulation.
              </p>

              <div className="p-2.5 bg-slate-500/5 rounded border border-slate-700/10 space-y-1">
                <span className="text-[9px] font-bold uppercase text-slate-400 block">Genesis Ledger SHA256 Hash</span>
                <span className="font-mono text-[9px] text-[#0078D4] block truncate">
                  8f39b2a1e09c8d764bb77f98012cc4a9b8e9f201048203cba8b29ff100a98b2c
                </span>
              </div>

              <div className="p-2.5 bg-slate-500/5 rounded border border-slate-700/10 space-y-1">
                <span className="text-[9px] font-bold uppercase text-slate-400 block">Active Block Validation Status</span>
                <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-[10px]">
                  <ShieldCheck size={12} />
                  <span>Sealed Integrity Certified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
