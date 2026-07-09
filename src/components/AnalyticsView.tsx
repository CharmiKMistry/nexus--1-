import React, { useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  FileText, 
  Download, 
  Calendar, 
  Sparkles, 
  CheckCircle,
  Database,
  ArrowDownToLine,
  HelpCircle
} from "lucide-react";

interface AnalyticsViewProps {
  theme: "dark" | "light";
}

export default function AnalyticsView({ theme }: AnalyticsViewProps) {
  const [selectedReport, setSelectedReport] = useState("Payroll Ready Feed");

  // Recharts Chart mock datasets (highly precise)
  const accuracyTrendData = [
    { name: "Jan", accuracy: 94.2, manualEffortHours: 120 },
    { name: "Feb", accuracy: 95.1, manualEffortHours: 105 },
    { name: "Mar", accuracy: 96.0, manualEffortHours: 90 },
    { name: "Apr", accuracy: 97.4, manualEffortHours: 65 },
    { name: "May", accuracy: 98.8, manualEffortHours: 42 },
    { name: "Jun", accuracy: 99.7, manualEffortHours: 18 }
  ];

  const errorDistribution = [
    { name: "Overtime Violations", value: 45, color: "#EF4444" },
    { name: "Tax Bracket Misalignments", value: 30, color: "#F59E0B" },
    { name: "Duplicate Entries", value: 15, color: "#3B82F6" },
    { name: "Base Salary Variances", value: 10, color: "#10B981" }
  ];

  const countryVolumeComparison = [
    { name: "Mumbai Hub", value: 380000 },
    { name: "Bengaluru Hub", value: 450000 },
    { name: "Pune Hub", value: 290000 },
    { name: "Delhi NCR Hub", value: 190000 },
    { name: "Noida Hub", value: 110000 },
    { name: "Hyderabad Hub", value: 340000 }
  ];

  const triggerExport = (format: "csv" | "xlsx" | "pdf") => {
    // Generate simple client-side file triggers
    let content = "";
    let mimeType = "";
    let extension = "";

    if (selectedReport === "Payroll Ready Feed") {
      content = "EmployeeId,EmployeeName,Country,Department,BaseSalary,OvertimePay,EPFContribution,TotalPay\n" +
                "EMP-1042,Amit Gupta,India,Engineering,185000,5400,22200,168200\n" +
                "EMP-2109,Sai Gupta,India,Product,158000,0,18960,139040\n" +
                "EMP-0098,Sneha Patel,India,Sales,225000,0,27000,198000\n" +
                "EMP-8044,Amit Patel,India,Support,85000,0,10200,74800\n";
      mimeType = "text/csv";
      extension = "csv";
    } else {
      content = "--- NEXUS AUDIT EXPORT RECORD ---\n" +
                "Timestamp: 2026-07-06T10:26Z\n" +
                "Cycle: July 2026\n" +
                "Auditor Profile: Ronak Surve\n" +
                "Bypass Logs: Approved India Daily Overtime Bypass for Amit Gupta (EMP-1042)\n";
      mimeType = "text/plain";
      extension = "txt";
    }

    if (format === "pdf") {
      alert("Printable PDF layout triggered. Downloading local copy...");
      return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedReport.toLowerCase().replace(/\s+/g, "_")}_july_2026.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isDark = theme === "dark";

  return (
    <div className="space-y-4" id="analytics_and_reports_container">
      {/* Visual bento grid charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend analysis chart */}
        <div className={`p-3.5 rounded-md border lg:col-span-2 ${
          isDark ? "bg-[#1F1F1F] border-[#2D2D2D] text-white" : "bg-white border-[#EDEBE9] text-[#323130] shadow-sm"
        }`}>
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700/10">
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Payroll Orchestration Performance Trend</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Reconciliation Accuracy % vs. Manual Auditing Hours</p>
            </div>
            <span className="text-[10px] text-[#107C10] font-bold bg-[#107C10]/10 px-2 py-0.5 rounded">
              -85% Manual Work
            </span>
          </div>

          <div className="h-[210px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={accuracyTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} />
                <YAxis stroke="#94A3B8" fontSize={10} domain={[90, 100]} />
                <Tooltip 
                  contentStyle={isDark ? { backgroundColor: "#1F1F1F", border: "1px solid #2D2D2D", color: "#fff" } : { backgroundColor: "#fff", border: "1px solid #EDEBE9", color: "#323130" }}
                />
                <Line type="monotone" dataKey="accuracy" stroke="#0078D4" strokeWidth={2.5} name="Accuracy %" />
                <Line type="monotone" dataKey="manualEffortHours" stroke="#C49B00" strokeWidth={1.5} name="Manual Auditing (Hours)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Error distribution donut */}
        <div className={`p-3.5 rounded-md border flex flex-col justify-between ${
          isDark ? "bg-[#1F1F1F] border-[#2D2D2D] text-white" : "bg-white border-[#EDEBE9] text-[#323130] shadow-sm"
        }`}>
          <div className="border-b pb-1.5 border-slate-700/10">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Anomalies Category Share</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Identified pattern violations under current cycle</p>
          </div>

          <div className="h-[140px] w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={errorDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {errorDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className="text-[9px] text-slate-400 block uppercase">Total Flags</span>
              <span className="text-base font-black text-[#A80000] font-mono">5</span>
            </div>
          </div>

          <div className="space-y-1 text-[10px] mt-2">
            {errorDistribution.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400 font-semibold">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}
                </span>
                <span className="font-bold font-mono text-[#323130] dark:text-slate-300">{entry.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reports Export Module */}
      <div className={`p-3.5 rounded-md border ${
        isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"
      }`}>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700/10">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Database size={12} />
            NEXUS Enterprise Report Generator
          </h3>
          <span className="text-[10px] text-slate-400">Cycle status: July Active Ingestion</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Select report type */}
          <div className="flex flex-col gap-1.5">
            {[
              "Payroll Ready Feed",
              "Compliance & Audit Logs",
              "Local Entity Validation Summary",
              "Executive SLA Compliance Report"
            ].map((report) => (
              <button
                key={report}
                id={`report_type_btn_${report.replace(/\s+/g, "_")}`}
                onClick={() => setSelectedReport(report)}
                className={`p-2.5 rounded text-left text-xs font-bold border transition-all ${
                  selectedReport === report
                    ? (isDark ? "bg-[#2D2D2D] border-[#0078D4] text-white" : "bg-[#EFF6FC] border-[#0078D4] text-[#0078D4]")
                    : (isDark ? "bg-[#1F1F1F] border-transparent text-slate-300 hover:bg-[#2D2D2D]" : "bg-[#FAF9F8] border-transparent text-slate-600 hover:bg-[#F3F2F1]")
                }`}
              >
                {report}
              </button>
            ))}
          </div>

          {/* Report specifications and export actions */}
          <div className="lg:col-span-2 flex flex-col justify-between p-3 rounded border border-slate-700/10 dark:border-[#2D2D2D] bg-slate-500/5">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#C49B00]">
                <Sparkles size={12} />
                <span>NEXUS Report Preview — July Cycle</span>
              </div>

              {selectedReport === "Payroll Ready Feed" ? (
                <div>
                  <h4 className="text-xs font-bold text-[#323130] dark:text-slate-300">Standardized Global Inbound Schema</h4>
                  <p className="text-[10.5px] text-slate-400 mt-0.5 leading-relaxed">
                    Outputs fully mapped, verified, and reconciled employee parameters ready for direct ledger upload in ERP systems (SAP, Workday, ADP).
                  </p>
                  <div className="mt-2.5 p-2 bg-[#161616] rounded border border-[#2D2D2D] text-[9.5px] font-mono text-slate-300 overflow-x-auto">
                    EmployeeId,EmployeeName,Country,Department,BaseSalary,OvertimePay,CPFContribution,TotalPay...
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="text-xs font-bold text-[#323130] dark:text-slate-300">Immutable Cryptographic Audit Ledger</h4>
                  <p className="text-[10.5px] text-slate-400 mt-0.5 leading-relaxed">
                    Extracts raw and validated event triggers, including user and machine bypass signatures, providing direct auditor readiness logs.
                  </p>
                  <div className="mt-2.5 p-2 bg-[#161616] rounded border border-[#2D2D2D] text-[9.5px] font-mono text-slate-300 overflow-x-auto">
                    [03:15:22] [Reconciliation Agent] Aligned CPF variance for Marcus Tan. Retro value: S$250.00...
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-700/10">
              <button
                onClick={() => triggerExport("csv")}
                id="btn_export_csv"
                className="px-2.5 py-1.5 bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-bold rounded flex items-center gap-1 shadow-sm transition"
              >
                <ArrowDownToLine size={12} /> Export CSV
              </button>
              <button
                onClick={() => triggerExport("xlsx")}
                id="btn_export_xlsx"
                className="px-2.5 py-1.5 bg-[#107C10] hover:bg-[#0B590B] text-white text-xs font-bold rounded flex items-center gap-1 shadow-sm transition"
              >
                <ArrowDownToLine size={12} /> Export Excel
              </button>
              <button
                onClick={() => triggerExport("pdf")}
                id="btn_export_pdf"
                className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-850 text-white text-xs font-bold rounded flex items-center gap-1 shadow-sm transition"
              >
                <ArrowDownToLine size={12} /> Export PDF Printout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
