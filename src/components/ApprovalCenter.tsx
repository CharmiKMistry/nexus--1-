import React, { useState } from "react";
import { 
  CheckSquare, 
  UserCheck, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  FileCheck2, 
  FileLock, 
  ChevronRight, 
  Layers,
  Sparkles
} from "lucide-react";
import { Country } from "../types";
import { NexusDB } from "../lib/db";
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../lib/firebase";

interface ApprovalCenterProps {
  theme: "dark" | "light";
  countries: Country[];
  onCountriesUpdate: (nextCountries: Country[]) => void;
  currentRole: string;
}

const defaultChecklists = {
  sg: [
    { label: "Verify Marcus Tan's retroactive CPF 5% difference applied (S$ 250)", checked: true },
    { label: "Audit Singapore Workday base salary feed parity", checked: true },
    { label: "Generate IRAS tax declaration pre-audit package", checked: true }
  ],
  de: [
    { label: "German daily working hours compliance check (Arbeitszeitgesetz)", checked: true },
    { label: "Convert Anna Weber's 1.5 excess hours to TOIL shift balance", checked: false },
    { label: "German social security insurance contribution match check (AOK)", checked: true },
    { label: "Resolve duplicate Elena Rostova entries between SAP & Workday", checked: false }
  ],
  us: [
    { label: "FLSA Overtime exemptions review (earning threshold $844/week)", checked: false },
    { label: "Verify John Doe's non-exempt 1.5x Overtime premium premium rate", checked: false },
    { label: "Cross-check US internal timesheet logs vs external Fieldglass feeds", checked: true }
  ],
  jp: [
    { label: "Confirm MyNumber Tax ID is ingested for Hiroshi Sato", checked: true },
    { label: "Calculate late-night overtime premium multipliers (1.5x statutory check)", checked: true }
  ],
  fr: [
    { label: "Validate French statutory RTT (Reduction of Working Time) allocation", checked: false },
    { label: "Audit base salary minimum threshold according to Syntec Agreement", checked: false }
  ]
};

export default function ApprovalCenter({ 
  theme, 
  countries, 
  onCountriesUpdate,
  currentRole 
}: ApprovalCenterProps) {
  
  const [selectedCountryId, setSelectedCountryId] = useState<string>("de"); // Default to Germany
  const [signatureName, setSignatureName] = useState("");
  const [signatureComments, setSignatureComments] = useState("");
  
  const isDark = theme === "dark";

  // Active check-lists for compliance, backed by localStorage to survive tab switching
  const [checklists, setChecklists] = useState<Record<string, { label: string; checked: boolean }[]>>(() => {
    const saved = localStorage.getItem("nexus_compliance_checklists");
    return saved ? JSON.parse(saved) : defaultChecklists;
  });

  const saveChecklists = (next: Record<string, { label: string; checked: boolean }[]>) => {
    setChecklists(next);
    localStorage.setItem("nexus_compliance_checklists", JSON.stringify(next));
  };

  const activeCountry = countries.find(c => c.id === selectedCountryId) || countries[0];

  // Safeguard against loading/empty countries state from Firestore on first render
  if (countries.length === 0 || !activeCountry) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center" id="approval_loading_state">
        <Clock className="w-8 h-8 text-[#0078D4] animate-spin mb-3" />
        <h3 className="text-sm font-bold text-slate-400">Loading Entity Level Payroll Cycles...</h3>
        <p className="text-xs text-slate-500 mt-1">Fetching live compliance checklists from cloud registry...</p>
      </div>
    );
  }

  const toggleChecklistItem = (countryId: string, idx: number) => {
    const list = checklists[countryId] || [];
    const updated = [...list];
    updated[idx].checked = !updated[idx].checked;
    
    const nextChecklists = {
      ...checklists,
      [countryId]: updated
    };
    saveChecklists(nextChecklists);

    // Write an audit log for item toggles
    NexusDB.auditLogs = [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: `Ronak Surve (${currentRole})`,
        role: currentRole,
        action: `Checked Compliance Item: ${updated[idx].label}`,
        details: `Toggled status to ${updated[idx].checked ? "Verified" : "Pending"} for country ${countryId.toUpperCase()}.`
      },
      ...NexusDB.auditLogs
    ];

    // Asynchronously write toggle audit log to Firestore
    const logToggleToFirestore = async () => {
      try {
        await addDoc(collection(db, "AuditLogs"), {
          timestamp: new Date().toISOString(),
          user: `Ronak Surve (${currentRole})`,
          role: currentRole,
          action: `Checked Compliance Item: ${updated[idx].label}`,
          details: `Toggled status to ${updated[idx].checked ? "Verified" : "Pending"} for country ${countryId.toUpperCase()}.`
        });
      } catch (err) {
        console.error("Failed to write checklist toggle audit log to Firestore:", err);
      }
    };
    logToggleToFirestore();
  };

  const handleExecuteApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatureName) {
      alert("Please provide an authorized digital signature name.");
      return;
    }

    // Verify if all checklist items are checked for the country
    const countryList = checklists[selectedCountryId] || [];
    const uncheckedItems = countryList.filter(item => !item.checked);
    if (uncheckedItems.length > 0) {
      if (!confirm(`Warning: There are ${uncheckedItems.length} compliance checklist items unresolved. Proceed with sign-off override anyway?`)) {
        return;
      }
    }

    // Advance the status in our state and Firebase emulator
    const updatedCountries = countries.map(c => {
      if (c.id === selectedCountryId) {
        return {
          ...c,
          status: "Completed" as const,
          readinessScore: 100,
          complianceScore: 100,
          riskLevel: "Low" as const
        };
      }
      return c;
    });

    onCountriesUpdate(updatedCountries);

    // Update Country Status in Firestore for cloud persistence!
    const syncCountryToFirestore = async () => {
      try {
        const countryRef = doc(db, "Countries", selectedCountryId);
        await updateDoc(countryRef, {
          status: "Completed",
          readinessScore: 100,
          complianceScore: 100,
          riskLevel: "Low"
        });
      } catch (err) {
        console.error("Failed to sync certified country status to Firestore:", err);
      }
    };
    syncCountryToFirestore();

    // Save digital approval record
    const newApproval = {
      id: `appr-${selectedCountryId}-${Date.now().toString().slice(-4)}`,
      eventId: `cycle-2026-07-${selectedCountryId}`,
      approverName: signatureName,
      role: currentRole,
      status: "Approved",
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      comments: signatureComments || "Entity cycle verified, signed off digitally."
    };

    NexusDB.auditLogs = [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: `${signatureName} (${currentRole})`,
        role: currentRole,
        action: `Digitally Certified Payroll Cycle: ${activeCountry.name}`,
        details: `Officially signed off the July 2026 payroll cycle for entity ${activeCountry.name}. Readiness score updated to 100%. Comments: "${newApproval.comments}"`
      },
      ...NexusDB.auditLogs
    ];

    // Asynchronously write certification Audit Log to Firestore
    const logCertifyToFirestore = async () => {
      try {
        await addDoc(collection(db, "AuditLogs"), {
          timestamp: new Date().toISOString(),
          user: `${signatureName} (${currentRole})`,
          role: currentRole,
          action: `Digitally Certified Payroll Cycle: ${activeCountry.name}`,
          details: `Officially signed off the July 2026 payroll cycle for entity ${activeCountry.name}. Readiness score updated to 100%. Comments: "${newApproval.comments}"`
        });
      } catch (err) {
        console.error("Failed to sync digital certification audit log to Firestore:", err);
      }
    };
    logCertifyToFirestore();

    alert(`✓ Digital Certificate Issued! July 2026 payroll run for "${activeCountry.name}" is now signed off and locked. Transmitting finalized XML feed to Workday...`);
    setSignatureName("");
    setSignatureComments("");
  };

  const getSlaHoursRemaining = (countryId: string) => {
    switch (countryId) {
      case "de": return "14 Hours (Critical)";
      case "us": return "28 Hours";
      case "fr": return "72 Hours";
      case "jp": return "Completed";
      default: return "Completed";
    }
  };

  const getSlaBadgeClass = (countryId: string) => {
    switch (countryId) {
      case "de": return "bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse";
      case "us": return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
      case "fr": return "bg-blue-500/10 text-blue-500 border border-blue-500/20";
      default: return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
    }
  };

  return (
    <div className="space-y-4" id="approval_center_main_container">
      {/* Top Description */}
      <div className="flex items-center justify-between border-b border-[#EDEBE9]/40 pb-2">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <CheckSquare size={13} />
            Entity Level Approval Center
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Orchestrate multi-role sign-offs, inspect compliance checklists, and execute cryptographic payroll certifications.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column: Country cycles Selector & SLA Counters */}
        <div className="space-y-3">
          <div className={`p-3.5 rounded-md border space-y-2.5 ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"}`}>
            <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Layers size={11} />
              Entity Run Sign-offs
            </h3>

            <div className="space-y-2">
              {countries.map((c) => {
                const checkedCount = checklists[c.id]?.filter(item => item.checked).length || 0;
                const totalCount = checklists[c.id]?.length || 0;
                const isSelected = selectedCountryId === c.id;

                return (
                  <div 
                    key={c.id}
                    onClick={() => setSelectedCountryId(c.id)}
                    className={`p-2.5 rounded border text-xs cursor-pointer transition-all flex flex-col justify-between gap-1.5 ${
                      isSelected 
                        ? (isDark ? "bg-[#0078D4]/10 border-[#0078D4] shadow-sm" : "bg-[#EFF6FC] border-[#0078D4] shadow-sm")
                        : (isDark ? "bg-[#1F1F1F] border-[#2D2D2D] hover:border-slate-500" : "bg-white border-[#EDEBE9] hover:bg-[#FAF9F8]")
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-[#323130] dark:text-white">
                        <span>{c.flag}</span>
                        <span>{c.name}</span>
                      </div>
                      <span className={`px-1.5 py-0.5 text-[8.5px] font-mono rounded font-bold ${getSlaBadgeClass(c.id)}`}>
                        {c.status === "Completed" ? "Certified" : getSlaHoursRemaining(c.id)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10.5px] text-slate-400 font-semibold">
                      <span>Checklist: {checkedCount}/{totalCount} Done</span>
                      <span className={c.status === "Completed" ? "text-[#107C10]" : "text-[#C49B00]"}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column (span-2): Detailed checklist inspection and digital signature block */}
        <div className="lg:col-span-2 space-y-3">
          <div className={`p-4 rounded-md border space-y-4 ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"}`} id="checklist_approval_details">
            <div className="flex items-center justify-between border-b border-[#EDEBE9]/20 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{activeCountry.flag}</span>
                <div>
                  <h3 className="font-extrabold text-sm text-[#323130] dark:text-white">{activeCountry.name} July Payroll Run</h3>
                  <p className="text-[10px] text-slate-400">Currency: {activeCountry.currency} | Target release date: July 28th</p>
                </div>
              </div>

              <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${
                activeCountry.status === "Completed" 
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                  : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
              }`}>
                {activeCountry.status}
              </span>
            </div>

            {/* Checklist items block */}
            <div className="space-y-2.5">
              <h4 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-[#107C10]" />
                Compliance Gatekeeper Checklist
              </h4>

              <div className="space-y-1.5">
                {(checklists[activeCountry.id] || []).map((item, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      if (activeCountry.status !== "Completed") {
                        toggleChecklistItem(activeCountry.id, idx);
                      }
                    }}
                    className={`p-2.5 rounded border text-xs flex items-center gap-2.5 transition ${
                      activeCountry.status === "Completed" ? "cursor-not-allowed opacity-80" : "cursor-pointer"
                    } ${
                      item.checked
                        ? (isDark ? "bg-[#107C10]/5 border-[#107C10]/20 text-slate-200" : "bg-emerald-500/5 border-emerald-500/15 text-emerald-900")
                        : (isDark ? "bg-[#2D2D2D]/20 border-[#2D2D2D] text-slate-400" : "bg-[#FAF9F8] border-[#EDEBE9] text-slate-500")
                    }`}
                  >
                    <input 
                      type="checkbox"
                      checked={item.checked}
                      readOnly
                      className="w-3.5 h-3.5 rounded text-[#0078D4] accent-[#0078D4] shrink-0"
                    />
                    <span className={`font-semibold ${item.checked ? "line-through text-slate-500" : ""}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* In-view Workflow Pipeline display */}
            <div className="space-y-2">
              <h4 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Clock size={11} />
                Approval Routing Hierarchy
              </h4>
              <div className="flex flex-col md:flex-row items-center gap-1 text-[10px]">
                {activeCountry.workflow.map((step, idx) => {
                  const isLast = idx === activeCountry.workflow.length - 1;
                  return (
                    <React.Fragment key={idx}>
                      <div className={`p-1.5 rounded border font-semibold flex items-center gap-1 ${
                        activeCountry.status === "Completed"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                          : (idx === 1 ? "bg-[#0078D4]/10 border-[#0078D4] text-[#0078D4] font-bold animate-pulse" : "bg-slate-500/5 border-slate-700/10 text-slate-400")
                      }`}>
                        <span>{step}</span>
                        {activeCountry.status === "Completed" && <CheckCircle2 size={10} />}
                      </div>
                      {!isLast && <ChevronRight size={12} className="text-slate-500 rotate-90 md:rotate-0" />}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Cryptographic digital sign-off container */}
            {activeCountry.status !== "Completed" ? (
              <form onSubmit={handleExecuteApproval} className={`p-3.5 rounded border border-dashed ${isDark ? "bg-[#161616] border-[#2D2D2D]" : "bg-[#FAF9F8] border-[#EDEBE9]"}`} id="sign_off_form">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                  <UserCheck size={12} className="text-[#0078D4]" />
                  Cryptographic Digital Certification Block
                </h4>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block">Authorized Approver Name <span className="text-rose-500">*</span></label>
                      <input 
                        type="text" 
                        placeholder="e.g., Ronak Surve" 
                        value={signatureName}
                        onChange={(e) => setSignatureName(e.target.value)}
                        className={`w-full text-xs p-1.5 rounded border outline-none font-semibold ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9]"}`}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block">System Verification Stamp</label>
                      <input 
                        type="text" 
                        disabled
                        value={`NEXUS_SECURE_KEY_${activeCountry.id.toUpperCase()}_SHA256`} 
                        className="w-full text-xs p-1.5 rounded border font-mono text-slate-500 cursor-not-allowed bg-slate-500/5 dark:border-[#2D2D2D]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">Audit Sign-off Comments / Notes</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Audited and verified all Working Time guidelines. German TOIL adjustments reconciled." 
                      value={signatureComments}
                      onChange={(e) => setSignatureComments(e.target.value)}
                      className={`w-full text-xs p-1.5 rounded border outline-none ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9]"}`}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-1.5 bg-[#107C10] hover:bg-[#0B590B] text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <FileLock size={13} />
                    Digitally Seal & Certify Entity Payroll Run
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3.5 bg-emerald-500/5 rounded border border-emerald-500/20 text-center flex flex-col items-center justify-center py-5">
                <CheckCircle2 size={24} className="text-[#107C10] mb-2" />
                <h4 className="text-xs font-bold text-[#107C10] uppercase tracking-wider">Entity Run Certified & Immutable</h4>
                <p className="text-[10.5px] text-slate-400 mt-1 max-w-sm">
                  July 2026 payroll for this region is officially locked. Data has been transmitted securely via secure webhook to regional bank and Workday endpoints.
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
