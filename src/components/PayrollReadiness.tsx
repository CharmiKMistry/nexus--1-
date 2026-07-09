import React, { useState } from "react";
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  ArrowRight, 
  ChevronRight, 
  RefreshCw,
  TrendingUp,
  Sliders,
  CheckCircle2
} from "lucide-react";
import { Country, ValidationResult, ReconciliationResult } from "../types";
import { NexusDB } from "../lib/db";

interface PayrollReadinessProps {
  theme: "dark" | "light";
  countries: Country[];
  validations: ValidationResult[];
  reconciliations: ReconciliationResult[];
  onTabChange: (tabId: string) => void;
}

export default function PayrollReadiness({ 
  theme, 
  countries, 
  validations, 
  reconciliations,
  onTabChange 
}: PayrollReadinessProps) {
  const [simulatedProgress, setSimulatedProgress] = useState<number | null>(null);
  const [simulationStatus, setSimulationStatus] = useState("");
  
  const isDark = theme === "dark";

  // Global counts
  const pendingAnomalies = validations.filter(v => v.status === "Pending").length;
  const pendingReconciliations = reconciliations.filter(r => r.status === "Pending").length;
  const pendingApprovals = countries.filter(c => c.status !== "Completed").length;

  // Run full simulation
  const handleTriggerReplay = () => {
    setSimulatedProgress(0);
    setSimulationStatus("Polling Workday API feeds...");
    
    setTimeout(() => {
      setSimulatedProgress(20);
      setSimulationStatus("Ingesting Mumbai Excel Overtime sheet...");
    }, 600);

    setTimeout(() => {
      setSimulatedProgress(45);
      setSimulationStatus("Analyzing India Factories Act working hours limits...");
    }, 1300);

    setTimeout(() => {
      setSimulatedProgress(65);
      setSimulationStatus("Performing India EPF basic threshold eligibility check...");
    }, 2000);

    setTimeout(() => {
      setSimulatedProgress(85);
      setSimulationStatus("Generating cross-system reconciliation audit trail...");
    }, 2700);

    setTimeout(() => {
      setSimulatedProgress(100);
      setSimulationStatus("Global governance reports generated and ready for sign-off!");
      
      // Add audit log
      NexusDB.auditLogs = [
        {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: "Ronak Surve (Super Admin)",
          role: "Super Admin",
          action: "Replayed Processing Pipeline",
          details: "Ran deep statutory scans over 1,420 global records across all channels."
        },
        ...NexusDB.auditLogs
      ];
    }, 3400);
  };

  return (
    <div className="space-y-4" id="payroll_readiness_main_container">
      {/* Overview Block */}
      <div className="flex items-center justify-between border-b border-[#EDEBE9]/40 pb-2">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Activity size={13} />
            Global Payroll Readiness & Governance Command
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Evaluate country-specific readiness statuses, review outstanding anomalies, and play back processing workflows.</p>
        </div>
      </div>

      {/* Replay Simulation Widget */}
      <div className={`p-4 rounded-md border space-y-3 ${
        isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"
      }`} id="workflow_replay_panel">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-[#EDEBE9]/20 pb-2">
          <div>
            <h4 className="text-xs font-bold text-[#323130] dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles size={13} className="text-[#0078D4]" />
              Workday / SAP Inflow Workflow Replay
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Trigger a simulated system execution loop to inspect real-time audit triggers, rules validations, and sync actions.</p>
          </div>

          {simulatedProgress === null ? (
            <button
              onClick={handleTriggerReplay}
              className="px-3 py-1 bg-[#0078D4] hover:bg-[#005A9E] text-white rounded text-xs font-bold flex items-center gap-1 transition"
            >
              <RefreshCw size={12} />
              Replay Processing Loop
            </button>
          ) : (
            <div className="text-[11px] font-mono font-bold text-[#0078D4] flex items-center gap-1.5 bg-[#0078D4]/10 px-2 py-0.5 rounded border border-[#0078D4]/20">
              <RefreshCw size={11} className="animate-spin" />
              <span>{simulatedProgress}% Processing</span>
            </div>
          )}
        </div>

        {simulatedProgress !== null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Task: {simulationStatus}</span>
              <span className="font-bold text-[#0078D4]">{simulatedProgress}%</span>
            </div>
            <div className="w-full bg-slate-500/10 rounded-full h-1.5 border border-slate-700/10">
              <div 
                className="bg-[#0078D4] h-1.5 rounded-full transition-all duration-300" 
                style={{ width: `${simulatedProgress}%` }} 
              />
            </div>
            {simulatedProgress === 100 && (
              <div className="flex justify-end pt-1">
                <button 
                  onClick={() => setSimulatedProgress(null)}
                  className="text-[10px] font-bold text-slate-400 hover:text-white"
                >
                  Clear Playback Logs
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Diagnostics Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5" id="readiness_diagnostics_bento">
        {/* Card 1: Outstanding Anomalies */}
        <div className={`p-4 rounded-md border flex flex-col justify-between h-[135px] transition hover:scale-[1.002] ${
          isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Statutory Anomalies</span>
              <ShieldAlert className="text-[#A80000]" size={14} />
            </div>
            <h4 className="text-2xl font-black mt-2 text-[#A80000]">{pendingAnomalies} Exceptions</h4>
            <p className="text-[10px] text-slate-400 mt-1">Pending validation adjustments or compliance bypasses.</p>
          </div>
          <button 
            onClick={() => onTabChange("validation")}
            className="text-[10.5px] font-bold text-[#0078D4] hover:underline flex items-center gap-0.5 mt-2 self-start"
          >
            Audit Exceptions <ArrowRight size={10} />
          </button>
        </div>

        {/* Card 2: Unreconciled Feed Deltas */}
        <div className={`p-4 rounded-md border flex flex-col justify-between h-[135px] transition hover:scale-[1.002] ${
          isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Reconciliation Deltas</span>
              <AlertTriangle className="text-[#C49B00]" size={14} />
            </div>
            <h4 className="text-2xl font-black mt-2 text-[#C49B00]">{pendingReconciliations} Discrepancies</h4>
            <p className="text-[10px] text-slate-400 mt-1">Divergent data between Timesheets, Claims, and HRMS records.</p>
          </div>
          <button 
            onClick={() => onTabChange("reconciliation")}
            className="text-[10.5px] font-bold text-[#0078D4] hover:underline flex items-center gap-0.5 mt-2 self-start"
          >
            Reconcile Deltas <ArrowRight size={10} />
          </button>
        </div>

        {/* Card 3: Pending Sign-offs */}
        <div className={`p-4 rounded-md border flex flex-col justify-between h-[135px] transition hover:scale-[1.002] ${
          isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Pending Approvals</span>
              <Activity className="text-[#0078D4]" size={14} />
            </div>
            <h4 className="text-2xl font-black mt-2 text-[#0078D4]">{pendingApprovals} Entities</h4>
            <p className="text-[10px] text-slate-400 mt-1">Regional payroll entities awaiting local compliance certification.</p>
          </div>
          <button 
            onClick={() => onTabChange("approval")}
            className="text-[10.5px] font-bold text-[#0078D4] hover:underline flex items-center gap-0.5 mt-2 self-start"
          >
            Approve Entities <ArrowRight size={10} />
          </button>
        </div>
      </div>

      {/* Country Diagnostic Table */}
      <div className={`p-4 rounded-md border ${
        isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"
      }`}>
        <h3 className="text-xs font-bold text-[#323130] dark:text-white mb-3 uppercase tracking-wider">Granular Readiness Diagnostics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b ${isDark ? "border-[#2D2D2D] text-slate-400" : "border-[#EDEBE9] text-[#605E5C]"}`}>
                <th className="py-2 px-2.5">Region</th>
                <th className="py-2 px-2.5">Anomalies Code</th>
                <th className="py-2 px-2.5">Reconciliation Gaps</th>
                <th className="py-2 px-2.5">Approval Phase</th>
                <th className="py-2 px-2.5">Readiness</th>
              </tr>
            </thead>
            <tbody>
              {countries.map((c) => {
                const regionalAnoms = validations.filter(v => v.country === c.name && v.status === "Pending").length;
                const regionalRecs = reconciliations.filter(r => {
                  const emp = NexusDB.employees.find(e => e.id === r.employeeId);
                  return emp?.country === c.name && r.status === "Pending";
                }).length;

                return (
                  <tr key={c.id} className={`border-b border-[#EDEBE9]/30 transition-colors ${isDark ? "border-[#2D2D2D]/50 hover:bg-[#2D2D2D]/30" : "hover:bg-[#F3F2F1]/30"}`}>
                    <td className="py-2.5 px-2.5 font-bold flex items-center gap-1.5">
                      <span className="text-base">{c.flag}</span>
                      <span>{c.name}</span>
                    </td>
                    <td className="py-2.5 px-2.5">
                      {regionalAnoms === 0 ? (
                        <span className="text-emerald-500 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={11} /> Clean Pass
                        </span>
                      ) : (
                        <span className="text-rose-500 font-semibold flex items-center gap-1 font-mono">
                          {regionalAnoms} Active
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-2.5">
                      {regionalRecs === 0 ? (
                        <span className="text-emerald-500 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={11} /> Fully Reconciled
                        </span>
                      ) : (
                        <span className="text-amber-500 font-semibold flex items-center gap-1 font-mono">
                          {regionalRecs} Discrepancies
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-2.5">
                      <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] uppercase ${
                        c.status === "Completed" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 font-black text-xs text-[#0078D4]">
                      {c.readinessScore}% Ready
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
