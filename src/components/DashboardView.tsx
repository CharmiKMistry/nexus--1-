import React, { useState } from "react";
import { 
  Sparkles, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Layers,
  ArrowRight,
  Globe,
  DollarSign,
  Briefcase
} from "lucide-react";
import { Country, UserRole, Employee, ValidationResult } from "../types";
import { useLocalization } from "./LocalizationContext";

interface DashboardViewProps {
  countries: Country[];
  setCountries: (countries: Country[]) => void;
  currentRole: UserRole;
  theme: "dark" | "light";
  onTabChange: (tabId: string) => void;
  employees: Employee[];
  validations: ValidationResult[];
  onResolveValidation: (id: string, newStatus: "Resolved" | "Ignored") => Promise<void>;
}

export default function DashboardView({
  countries,
  setCountries,
  currentRole,
  theme,
  onTabChange,
  employees,
  validations,
  onResolveValidation
}: DashboardViewProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  
  // Consume Localization Context
  const { preferences, t, formatCurrency, formatNumber } = useLocalization();
  const widgetOrder = preferences?.widgetOrder || ["metrics", "readiness", "validation", "distribution"];
  const hiddenWidgets = preferences?.hiddenWidgets || [];

  // Auto-select first country if none is selected
  React.useEffect(() => {
    if (countries.length > 0 && !selectedCountry) {
      setSelectedCountry(countries[0]);
    }
  }, [countries, selectedCountry]);

  // Filter countries or actions based on role permissions
  const getRoleFocusText = () => {
    switch (currentRole) {
      case "HR":
        return "Focus: Attendance logs, duplicates, and timesheet integrity.";
      case "Finance":
        return "Focus: Cost allocations, bank routing, tax/CPF retroactive values.";
      case "Compliance Officer":
        return "Focus: Overtime statutory laws, mandatory rest violations, and rule packs.";
      case "Auditor":
        return "Focus: Governance audit trail, bypass log authorizations, compliance checks.";
      case "Executive":
        return "Focus: Global readiness scores, payroll sign-offs, and risk heatmaps.";
      case "Super Admin":
        return "Focus: Global Orchestration. All modules & configurations unlocked.";
      default:
        return "Focus: General Payroll Ingestion & Orchestration Control.";
    }
  };

  const globalReadiness = countries.length > 0
    ? Math.round(countries.reduce((acc, c) => acc + c.readinessScore, 0) / countries.length)
    : 87;
  const complianceScore = countries.length > 0
    ? Math.round(countries.reduce((acc, c) => acc + c.complianceScore, 0) / countries.length)
    : 92;
  const dataQualityScore = countries.length > 0
    ? Math.round(countries.reduce((acc, c) => acc + c.dataQualityScore, 0) / countries.length)
    : 89;

  const getCountryColor = (score: number) => {
    if (score === 100) return "#107C10";
    if (score >= 80) return "#C49B00";
    return "#A80000";
  };

  const currentMonthSalarySum = employees.reduce((sum, e) => sum + (e.status === "Active" ? e.salary : 0), 0);
  const pendingAnomaliesCount = validations.filter(v => v.status === "Pending").length;

  // Render interactive table of regulatory governance instead of world map
  const renderCountryGovernanceTable = () => {
    const isDark = theme === "dark";

    return (
      <div className={`relative rounded-md p-3.5 border flex flex-col justify-between h-[290px] ${
        isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9]"
      }`} id="widget_country_governance_table">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Globe className="text-[#0078D4]" size={14} />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Regional Compliance & Statutory Policies</span>
          </div>
          <span className="text-[9px] bg-[#0078D4]/10 text-[#0078D4] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
            Live Database Feeds
          </span>
        </div>

        {/* Master-Detail Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 flex-1 min-h-0">
          {/* Left: Interactive Country list table */}
          <div className="flex flex-col h-full border-r border-slate-700/10 pr-2.5 overflow-y-auto max-h-[195px] scrollbar-thin">
            <table className="w-full text-left border-collapse text-[10.5px]">
              <thead>
                <tr className="border-b border-slate-700/10 text-slate-400 font-bold text-[8.5px] uppercase tracking-wider">
                  <th className="pb-1.5 font-bold">Country Entity</th>
                  <th className="pb-1.5 text-center font-bold">Readiness</th>
                  <th className="pb-1.5 text-right font-bold">Risk</th>
                </tr>
              </thead>
              <tbody>
                {countries.map(c => {
                  const isSelected = selectedCountry?.id === c.id;
                  return (
                    <tr 
                      key={c.id} 
                      onClick={() => setSelectedCountry(c)}
                      className={`cursor-pointer border-b border-slate-700/5 transition ${
                        isSelected 
                          ? "bg-[#0078D4]/10 font-semibold" 
                          : "hover:bg-slate-500/5"
                      }`}
                      id={`row_select_country_${c.id}`}
                    >
                      <td className="py-2 flex items-center gap-1.5">
                        <span className="text-sm">{c.flag}</span>
                        <span className="text-slate-800 dark:text-slate-200">{c.name}</span>
                      </td>
                      <td className="py-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="font-mono font-bold">{c.readinessScore}%</span>
                          <span className={`w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: getCountryColor(c.readinessScore) }} />
                        </div>
                      </td>
                      <td className="py-2 text-right">
                        <span className={`text-[9.5px] font-bold ${
                          c.riskLevel === "High" ? "text-[#A80000] dark:text-rose-400" : c.riskLevel === "Medium" ? "text-[#C49B00]" : "text-[#107C10]"
                        }`}>
                          {c.riskLevel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Right: Policy details panel */}
          <div className="flex flex-col h-full pl-1 max-h-[195px]">
            {selectedCountry ? (
              <div className="flex flex-col h-full justify-between overflow-y-auto max-h-[195px] pr-1">
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b pb-1 border-slate-700/10">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{selectedCountry.flag}</span>
                      <span className="font-bold text-[#323130] dark:text-white text-xs">{selectedCountry.name}</span>
                      <span className="text-[8px] bg-slate-500/10 text-slate-400 px-1 rounded uppercase font-mono">{selectedCountry.currency}</span>
                    </div>
                  </div>

                  <div className="text-[10px] space-y-1.5 text-slate-500 dark:text-slate-300">
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[8px] block">Overtime Policy:</span>
                      <p className="leading-snug text-slate-600 dark:text-slate-300">{selectedCountry.overtimePolicy}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[8px] block">Tax &amp; Contribution:</span>
                      <p className="leading-snug text-slate-600 dark:text-slate-300">{selectedCountry.taxRules}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      <div>
                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[8px] block">Leave Rules:</span>
                        <p className="leading-tight text-slate-600 dark:text-slate-300">{selectedCountry.leavePolicy}</p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[8px] block">Calendar / Hours:</span>
                        <p className="leading-tight text-slate-600 dark:text-slate-300">{selectedCountry.workingHours}h/week | {selectedCountry.payrollCalendar}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-700/10">
                  <span className="text-[9px] text-slate-400">
                    Compliance: <span className="text-[#107C10] font-bold">{selectedCountry.complianceScore}%</span>
                  </span>
                  <button 
                    onClick={() => onTabChange("rules")}
                    className="px-2 py-0.5 bg-[#0078D4] text-white rounded text-[9px] font-semibold hover:bg-[#005A9E] transition"
                  >
                    Configure Rules
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-3 text-slate-400">
                <Globe size={24} className="mb-1 text-slate-500 opacity-40 animate-pulse" />
                <span className="text-[10px]">Select a country entity to view statutory rules &amp; parameters.</span>
              </div>
            )}
          </div>
        </div>

        <p className="text-[9.5px] text-slate-400 text-center mt-1 border-t border-slate-700/5 pt-1">
          *Select any country in the list to inspect local statutory rules, tax policies, compliance audits, and active work hours.
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-4" id="dashboard_view_container">
      {/* Dynamic Persona banner */}
      <div className={`p-3.5 rounded-md border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        theme === "dark" 
          ? "bg-[#1F1F1F] border-[#2D2D2D]" 
          : "bg-gradient-to-r from-[#EFF6FC] to-[#FAF9F8] border-[#EDEBE9]"
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-[#0078D4]/10 text-[#0078D4]">
            <Sparkles size={16} className="animate-spin [animation-duration:6s]" />
          </div>
          <div>
            <h2 className="text-xs font-bold flex items-center gap-2 text-[#323130] dark:text-white">
              Welcome Back, {currentRole} <span className="text-[9px] bg-[#107C10]/10 text-[#107C10] px-1.5 py-0.5 rounded font-mono font-bold">Active Session</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">{getRoleFocusText()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold">
          <span className="text-slate-400">Current Payroll Cycle:</span>
          <span className={`px-2 py-0.5 rounded bg-[#0078D4]/10 text-[#0078D4] font-mono`}>JULY 2026 (Active)</span>
        </div>
      </div>

      {/* Render Widgets dynamically based on customized user order and visibility */}
      {widgetOrder.map((widgetId) => {
        if (hiddenWidgets.includes(widgetId)) return null;

        switch (widgetId) {
          case "metrics":
            return (
              <div key="metrics" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5" id="kpi_grid_container">
                {/* Readiness Card */}
                <div 
                  onClick={() => onTabChange("readiness")}
                  className={`p-3.5 rounded-md border flex flex-col justify-between h-[110px] transition-all hover:scale-[1.01] cursor-pointer ${
                    theme === "dark" 
                      ? "bg-[#1F1F1F] border-[#2D2D2D] hover:border-[#0078D4]" 
                      : "bg-white border-[#EDEBE9] shadow-sm hover:border-[#0078D4]"
                  }`}
                  id="metric_card_readiness"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400">{t("payroll_readiness")}</span>
                    <span className="text-[10px] bg-[#0078D4]/10 text-[#0078D4] px-1.5 py-0.5 rounded font-bold">Target 95%</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 my-1">
                    <span className="text-2xl font-black tracking-tight text-[#0078D4]">{globalReadiness}%</span>
                    <span className="text-[9px] text-[#A80000] font-bold flex items-center gap-0.5">▼ 2.4%</span>
                  </div>
                  <div className={`w-full ${theme === "dark" ? "bg-slate-800" : "bg-slate-100"} rounded-full h-1`}>
                    <div className="bg-[#0078D4] h-1 rounded-full" style={{ width: `${globalReadiness}%` }} />
                  </div>
                </div>

                {/* Compliance Score */}
                <div 
                  onClick={() => onTabChange("compliance")}
                  className={`p-3.5 rounded-md border flex flex-col justify-between h-[110px] transition-all hover:scale-[1.01] cursor-pointer ${
                    theme === "dark" 
                      ? "bg-[#1F1F1F] border-[#2D2D2D] hover:border-[#107C10]" 
                      : "bg-white border-[#EDEBE9] shadow-sm hover:border-[#107C10]"
                  }`}
                  id="metric_card_compliance"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400">Compliance Health</span>
                    <span className="text-[10px] bg-[#107C10]/10 text-[#107C10] px-1.5 py-0.5 rounded font-bold">Certified</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 my-1">
                    <span className="text-2xl font-black tracking-tight text-[#107C10]">{complianceScore}%</span>
                    <span className="text-[9px] text-[#107C10] font-bold flex items-center gap-0.5">▲ 0.8%</span>
                  </div>
                  <div className={`w-full ${theme === "dark" ? "bg-slate-800" : "bg-slate-100"} rounded-full h-1`}>
                    <div className="bg-[#107C10] h-1 rounded-full" style={{ width: `${complianceScore}%` }} />
                  </div>
                </div>

                {/* Data Quality */}
                <div 
                  onClick={() => onTabChange("validation")}
                  className={`p-3.5 rounded-md border flex flex-col justify-between h-[110px] transition-all hover:scale-[1.01] cursor-pointer ${
                    theme === "dark" 
                      ? "bg-[#1F1F1F] border-[#2D2D2D] hover:border-indigo-500" 
                      : "bg-white border-[#EDEBE9] shadow-sm hover:border-indigo-500"
                  }`}
                  id="metric_card_quality"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400">AI Data Quality Index</span>
                    <span className="text-[9px] bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded font-bold">Verified Logs</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 my-1">
                    <span className="text-2xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">{dataQualityScore}%</span>
                    <span className={`text-[9px] font-bold ${pendingAnomaliesCount > 0 ? "text-rose-500" : "text-[#107C10]"}`}>
                      {pendingAnomaliesCount} {pendingAnomaliesCount === 1 ? "anomaly" : "anomalies"}
                    </span>
                  </div>
                  <div className={`w-full ${theme === "dark" ? "bg-slate-800" : "bg-slate-100"} rounded-full h-1`}>
                    <div className="bg-indigo-600 h-1 rounded-full" style={{ width: `${dataQualityScore}%` }} />
                  </div>
                </div>

                {/* Ingested Volume */}
                <div 
                  onClick={() => onTabChange("manpower")}
                  className={`p-3.5 rounded-md border flex flex-col justify-between h-[110px] transition-all hover:scale-[1.01] cursor-pointer ${
                    theme === "dark" 
                      ? "bg-[#1F1F1F] border-[#2D2D2D] hover:border-[#C49B00]" 
                      : "bg-white border-[#EDEBE9] shadow-sm hover:border-[#C49B00]"
                  }`}
                  id="metric_card_volume"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400">Ingested Payroll Value</span>
                    <span className="text-[9px] bg-slate-500/15 text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold">USD</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 my-1">
                    <span className="text-xl font-extrabold tracking-tight text-[#C49B00]">
                      {formatCurrency(currentMonthSalarySum)}
                    </span>
                  </div>
                  <div className="text-[9.5px] text-slate-400 flex items-center justify-between">
                    <span>{formatNumber(employees.length)} Employees</span>
                    <span className="text-[#107C10] font-bold">Dynamic Sync</span>
                  </div>
                </div>
              </div>
            );

          case "readiness":
            return (
              <div key="readiness" className="grid grid-cols-1 lg:grid-cols-3 gap-4" id="dashboard_readiness_block">
                {/* Governance Table Panel */}
                <div className="lg:col-span-2">
                  {renderCountryGovernanceTable()}
                </div>

                {/* AI Recommendations panel */}
                <div className={`rounded-md p-3.5 border flex flex-col justify-between h-[290px] ${
                  theme === "dark" ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"
                }`} id="widget_ai_recommendations">
                  <div className="flex items-center justify-between mb-2 border-b pb-1.5 border-slate-700/10">
                    <div className="flex items-center gap-1 text-xs font-bold text-[#C49B00] uppercase">
                      <Sparkles size={12} />
                      <span>NEXUS AI Recommendations</span>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      pendingAnomaliesCount > 0 ? "bg-rose-500/10 text-rose-500" : "bg-[#107C10]/10 text-[#107C10]"
                    }`}>
                      {pendingAnomaliesCount} Active {pendingAnomaliesCount === 1 ? "Action" : "Actions"}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {validations.filter(v => v.status === "Pending").length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-3">
                        <CheckCircle size={28} className="text-[#107C10] mb-1.5 animate-pulse" />
                        <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-100">All Statutory Audits Approved</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                          NEXUS compliance engine has verified all work timecards, CPF rates, and tax brackets with zero active exceptions.
                        </p>
                      </div>
                    ) : (
                      validations.filter(v => v.status === "Pending").map(v => (
                        <div 
                          key={v.id}
                          className={`text-[11px] p-2 rounded border transition ${
                            v.severity === "High"
                              ? (theme === "dark" ? "border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10" : "border-[#FDE7E9] bg-[#FDE7E9]/40 hover:bg-[#FDE7E9]/80 text-[#323130]")
                              : (theme === "dark" ? "border-[#C49B00]/20 bg-[#C49B00]/5 hover:bg-[#C49B00]/10" : "border-[#FFF4CE] bg-[#FFF4CE]/40 hover:bg-[#FFF4CE]/80 text-[#323130]")
                          }`}
                          id={`recommendation_alert_${v.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-bold flex items-center gap-1 ${
                              v.severity === "High" ? "text-rose-500" : "text-[#795600] dark:text-amber-400"
                            }`}>
                              <ShieldAlert size={11} /> {v.issueType} ({v.country})
                            </span>
                            <span className="text-[8px] font-mono text-slate-400">{v.confidenceScore}% Conf</span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-300 mt-0.5 leading-tight">
                            <strong>{v.employeeName}:</strong> {v.explanation}
                          </p>
                          <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-700/5">
                            <button 
                              onClick={async () => {
                                if (confirm(`Authorize AI recommendation for ${v.employeeName}?`)) {
                                  await onResolveValidation(v.id, "Resolved");
                                }
                              }}
                              className="text-[9.5px] font-bold text-[#0078D4] hover:underline flex items-center gap-0.5"
                            >
                              Apply Action <ArrowRight size={8} />
                            </button>
                            <span className="text-[8.5px] text-slate-400 italic">Recommended</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="border-t border-slate-700/10 pt-2 flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 font-bold">Powered by Gemini AI</span>
                    <button 
                      onClick={() => onTabChange("validation")}
                      className="text-[10.5px] text-[#0078D4] hover:underline font-bold"
                    >
                      Analyze All
                    </button>
                  </div>
                </div>
              </div>
            );

          case "distribution":
            return (
              <div key="distribution" className={`p-3.5 rounded-md border ${
                theme === "dark" ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"
              }`} id="widget_payroll_status_distribution">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Global Payroll Cycles &amp; Entity Readiness</h3>
                  <span className="text-[9.5px] text-slate-400">Last updated: Just now</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className={`border-b ${theme === "dark" ? "border-[#2D2D2D] text-slate-400" : "border-[#EDEBE9] text-[#605E5C] font-semibold"}`}>
                        <th className="py-2 px-3">Entity Country</th>
                        <th className="py-2 px-3">Active Currency</th>
                        <th className="py-2 px-3">Readiness</th>
                        <th className="py-2 px-3">Data Quality</th>
                        <th className="py-2 px-3">Cycle Phase</th>
                        <th className="py-2 px-3">Risk Assessment</th>
                        <th className="py-2 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {countries.map((c) => (
                        <tr 
                          key={c.id} 
                          id={`dashboard_row_${c.id}`}
                          className={`border-b border-[#EDEBE9]/35 transition-colors ${
                            theme === "dark" ? "border-[#2D2D2D]/50 hover:bg-[#2D2D2D]/30" : "hover:bg-[#F3F2F1]/40"
                          }`}
                        >
                          <td className="py-2 px-3 font-semibold flex items-center gap-2">
                            <span className="text-lg">{c.flag}</span>
                            <span>{c.name}</span>
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-400">{c.currency}</td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-12 ${theme === "dark" ? "bg-slate-800" : "bg-slate-100"} h-1.5 rounded-full`}>
                                <div 
                                  className={`h-1.5 rounded-full ${
                                    c.readinessScore === 100 
                                      ? "bg-[#107C10]" 
                                      : c.readinessScore > 80 
                                        ? "bg-[#C49B00]" 
                                        : "bg-[#A80000]"
                                  }`}
                                  style={{ width: `${c.readinessScore}%` }}
                                />
                              </div>
                              <span className="font-bold">{c.readinessScore}%</span>
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 rounded font-mono font-bold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                              {c.dataQualityScore}%
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                              c.status === "Completed" 
                                ? "bg-[#107C10]/10 text-[#107C10]" 
                                : c.status === "Pending Approval" 
                                  ? "bg-[#C49B00]/10 text-[#C49B00]"
                                  : "bg-[#0078D4]/10 text-[#0078D4]"
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span className={`font-semibold flex items-center gap-1 ${
                              c.riskLevel === "High" 
                                ? "text-[#A80000] dark:text-rose-400" 
                                : c.riskLevel === "Medium" 
                                  ? "text-[#C49B00]" 
                                  : "text-[#107C10]"
                            }`}>
                              {c.riskLevel === "High" ? "● High Risk" : c.riskLevel === "Medium" ? "● Medium Risk" : "● Low Risk"}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button 
                              onClick={() => onTabChange("integration")}
                              className="px-2 py-0.5 rounded bg-[#0078D4] text-white text-[10px] font-bold hover:bg-[#005A9E] transition"
                            >
                              Audit Feed
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
