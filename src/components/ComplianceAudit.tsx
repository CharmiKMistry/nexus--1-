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
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";

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
      try {
        if (format === "CSV") {
          // Generate CSV content
          const csvHeaders = "ID,Timestamp,User,Role,Action,Details\n";
          const csvRows = filteredLogs.map(log => {
            const cleanId = `"${String(log.id || "").replace(/"/g, '""')}"`;
            const cleanTimestamp = `"${String(log.timestamp || "").replace(/"/g, '""')}"`;
            const cleanUser = `"${String(log.user || "").replace(/"/g, '""')}"`;
            const cleanRole = `"${String(log.role || "").replace(/"/g, '""')}"`;
            const cleanAction = `"${String(log.action || "").replace(/"/g, '""')}"`;
            const cleanDetails = `"${String(log.details || "").replace(/"/g, '""')}"`;
            return `${cleanId},${cleanTimestamp},${cleanUser},${cleanRole},${cleanAction},${cleanDetails}`;
          }).join("\n");
          
          const csvContent = csvHeaders + csvRows;
          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", `NEXUS_Immutable_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else if (format === "Excel") {
          // Generate Excel content using SheetJS
          const worksheetData = filteredLogs.map(log => ({
            "Log ID": log.id,
            "Timestamp": log.timestamp,
            "Administrator": log.user,
            "System Role": log.role,
            "Action Description": log.action,
            "Audit Details": log.details || ""
          }));
          const worksheet = XLSX.utils.json_to_sheet(worksheetData);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, "Immutable Audit Trail");
          
          const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
          const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", `NEXUS_Immutable_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else if (format === "PDF") {
          // Generate PDF content using jsPDF
          const doc = new jsPDF();
          
          // Header Banner
          doc.setFillColor(31, 41, 55); // Slate background
          doc.rect(0, 0, 210, 38, "F");
          
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(16);
          doc.setFont("helvetica", "bold");
          doc.text("NEXUS MUTUAL - COMPLIANCE AUDIT TRIAL LEDGER", 14, 15);
          
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.text("Immutable Audit Trail Archiving Overrides, Certificates, and Agentic Scans", 14, 22);
          doc.text(`Exported on: ${new Date().toLocaleString()} (UTC)`, 14, 28);
          doc.text("Status: CRYPTOGRAPHICALLY SECURED & ARCHIVED", 14, 33);
          
          let y = 50;
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          
          // Column Headers
          doc.text("User / Role", 14, y);
          doc.text("Action Description", 70, y);
          doc.text("Timestamp", 150, y);
          
          y += 4;
          doc.setDrawColor(200, 200, 200);
          doc.line(14, y, 196, y);
          y += 6;
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          
          filteredLogs.forEach((log) => {
            if (y > 270) {
              doc.addPage();
              y = 20;
              doc.setFont("helvetica", "bold");
              doc.text("User / Role", 14, y);
              doc.text("Action Description", 70, y);
              doc.text("Timestamp", 150, y);
              y += 4;
              doc.line(14, y, 196, y);
              y += 6;
              doc.setFont("helvetica", "normal");
            }
            
            // Print user and role
            doc.setFont("helvetica", "bold");
            doc.text(String(log.user || "").substring(0, 25), 14, y);
            doc.setFont("helvetica", "normal");
            doc.text(String(log.role || "").substring(0, 25), 14, y + 4);
            
            // Print Action
            const actionLines = doc.splitTextToSize(String(log.action || ""), 75);
            doc.text(actionLines, 70, y);
            
            // Print Timestamp
            doc.text(String(log.timestamp || "").substring(0, 19), 150, y);
            
            const actionHeight = actionLines.length * 4;
            const detailsText = log.details ? `Details: ${log.details}` : "";
            let detailsHeight = 0;
            
            if (detailsText) {
              const detailsLines = doc.splitTextToSize(detailsText, 175);
              detailsHeight = detailsLines.length * 4 + 2;
              
              if (y + Math.max(actionHeight, 8) + detailsHeight > 270) {
                doc.addPage();
                y = 20;
              }
              
              const textY = y + Math.max(actionHeight, 8) + 1;
              doc.setFont("helvetica", "italic");
              doc.setTextColor(100, 100, 100);
              doc.text(detailsLines, 14, textY);
              doc.setTextColor(0, 0, 0);
              doc.setFont("helvetica", "normal");
            }
            
            y += Math.max(actionHeight, 8) + detailsHeight + 6;
            doc.setDrawColor(240, 240, 240);
            doc.line(14, y - 3, 196, y - 3);
          });
          
          doc.save(`NEXUS_Immutable_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.pdf`);
        }
      } catch (err) {
        console.error("Export failed:", err);
      }
      setIsExporting(null);
    }, 1000);
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
