import React, { useState } from "react";
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  RefreshCw, 
  Sparkles, 
  Trash2, 
  ArrowRight,
  TrendingUp,
  Sliders,
  CheckCircle2,
  Settings
} from "lucide-react";
import { NexusDB, PayrollReport } from "../lib/db";

interface ReportsViewProps {
  theme: "dark" | "light";
}

export default function ReportsView({ theme }: ReportsViewProps) {
  const [reports, setReports] = useState<PayrollReport[]>([...NexusDB.reports]);
  const [reportType, setReportType] = useState("Payroll Summary");
  const [format, setFormat] = useState<"Excel" | "CSV" | "PDF">("PDF");
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilingProgress, setCompilingProgress] = useState(0);

  const isDark = theme === "dark";

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCompiling(true);
    setCompilingProgress(0);

    const interval = setInterval(() => {
      setCompilingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 25;
      });
    }, 400);

    setTimeout(() => {
      setIsCompiling(false);
      const newReport: PayrollReport = {
        id: `rep-${Date.now().toString().slice(-4)}`,
        name: `NEXUS_${reportType.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.${format.toLowerCase()}`,
        type: reportType,
        generatedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
        size: format === "PDF" ? "1.2 MB" : format === "Excel" ? "640 KB" : "180 KB",
        format: format,
        downloadUrl: "#",
        status: "Ready"
      };

      NexusDB.reports = [newReport, ...NexusDB.reports];
      setReports([newReport, ...reports]);

      NexusDB.auditLogs = [
        {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: "Ronak Surve (Super Admin)",
          role: "Super Admin",
          action: "Generated Executive Report",
          details: `Compiled ${reportType} report in ${format} format containing July 2026 payroll audit telemetry.`
        },
        ...NexusDB.auditLogs
      ];

      alert(`✓ Report "${newReport.name}" Compiled successfully! It is now stored in the local report server and available for secure download.`);
    }, 2000);
  };

  const handleDeleteReport = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete report: ${name}?`)) return;
    const nextReps = reports.filter(r => r.id !== id);
    setReports(nextReps);
    NexusDB.reports = NexusDB.reports.filter(r => r.id !== id);
  };

  const handleDownload = (name: string) => {
    alert(`Downloading files securely... Received cryptographically signed file download package: "${name}".`);
  };

  return (
    <div className="space-y-4" id="reports_view_container">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#EDEBE9]/40 pb-2 print:border-b-2 print:border-slate-800">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 print:text-slate-800 print:text-sm">
            <BarChart3 size={13} className="print:text-slate-800" />
            Governance & Executive Reports Compiler
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5 print:text-slate-600">Compile, customize, and securely retrieve enterprise-ready payroll reconciliation and auditing ledger documents.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-2.5 py-1 text-xs font-bold bg-[#0078D4] hover:bg-[#005A9E] text-white rounded flex items-center gap-1.5 transition print:hidden shadow-sm"
        >
          <FileText size={12} />
          Print Ledger
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column: Configuration Panel */}
        <div className="space-y-3 print:hidden">
          <form onSubmit={handleGenerateReport} className={`p-4 rounded-md border space-y-4 ${
            isDark ? "bg-[#1F1F1F] border-[#2D2D2D] text-white" : "bg-white border-[#EDEBE9] text-slate-800 shadow-sm"
          }`} id="report_generation_form">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/10 pb-2 flex items-center gap-1.5">
              <Settings size={12} />
              Report Customization
            </h3>

            {/* Select template */}
            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-slate-400">Report Template Category</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className={`w-full text-xs p-1.5 rounded border outline-none font-semibold ${
                  isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9]"
                }`}
              >
                <option value="Payroll Summary">Global Payroll Summary (July 2026)</option>
                <option value="Overtime Audit Detailed">German Working Time (Overtime) Audit</option>
                <option value="Reconciliation Variance">Variance & Retroactive Adjustments Sheet</option>
                <option value="Country Rule Compliance">Country-by-Country Regulatory Compliance Check</option>
              </select>
            </div>

            {/* Select Format */}
            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-slate-400">Download Format</label>
              <div className="grid grid-cols-3 gap-2">
                {(["PDF", "Excel", "CSV"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setFormat(fmt)}
                    className={`p-2 rounded border text-xs font-bold transition ${
                      format === fmt
                        ? "bg-[#0078D4]/15 border-[#0078D4] text-[#0078D4]"
                        : (isDark ? "border-[#2D2D2D] hover:bg-slate-800 text-slate-300" : "border-[#EDEBE9] hover:bg-[#F3F2F1] text-slate-600")
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Compile button or progress */}
            {isCompiling ? (
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Compiling dataset vectors...</span>
                  <span className="font-bold text-[#0078D4]">{compilingProgress}%</span>
                </div>
                <div className="w-full bg-slate-500/10 rounded-full h-1">
                  <div className="bg-[#0078D4] h-1 rounded-full transition-all" style={{ width: `${compilingProgress}%` }} />
                </div>
              </div>
            ) : (
              <button
                type="submit"
                className="w-full py-1.5 bg-[#0078D4] hover:bg-[#005A9E] text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={12} />
                Compile Executive Report
              </button>
            )}
          </form>
        </div>

        {/* Right column (span-2): Active compiled reports ledger */}
        <div className="lg:col-span-2 space-y-3 print:col-span-3 print:w-full">
          <div className={`p-4 rounded-md border space-y-3.5 ${
            isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"
          }`} id="reports_compiled_table_container">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/10 pb-2">
              Active Compiled Server Reports
            </h3>

            <div className="space-y-2">
              {reports.map((rep) => (
                <div 
                  key={rep.id}
                  className="p-3 rounded border border-slate-700/10 dark:border-[#2D2D2D] bg-slate-500/5 flex items-center justify-between transition hover:bg-slate-500/10"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded bg-slate-500/10 text-slate-400">
                      {rep.format === "PDF" ? <FileText size={16} className="text-rose-500" /> : <FileSpreadsheet size={16} className="text-emerald-500" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#323130] dark:text-white truncate max-w-xs">{rep.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Category: {rep.type} | Compiled: {rep.generatedAt} | Size: {rep.size}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 print:hidden">
                    <button
                      onClick={() => handleDownload(rep.name)}
                      className="p-1 text-xs font-bold text-[#0078D4] hover:underline flex items-center gap-1"
                      title="Download Report"
                    >
                      <Download size={13} />
                      Download
                    </button>
                    <button
                      onClick={() => handleDeleteReport(rep.id, rep.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Delete Report"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
