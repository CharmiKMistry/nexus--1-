import React, { useState } from "react";
import { 
  MapPin, 
  Save, 
  Plus, 
  HelpCircle, 
  CheckCircle, 
  Sliders, 
  Globe, 
  DollarSign, 
  Calendar, 
  Clock, 
  FileText,
  X
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Country } from "../types";

interface RuleEngineViewProps {
  countries: Country[];
  setCountries: (countries: Country[]) => void;
  theme: "dark" | "light";
}

export default function RuleEngineView({
  countries,
  setCountries,
  theme
}: RuleEngineViewProps) {
  const [selectedCountryId, setSelectedCountryId] = useState(countries[0]?.id || "sg");
  const [isSaving, setIsSaving] = useState(false);

  // Add country form states
  const [openAddCountryModal, setOpenAddCountryModal] = useState(false);
  const [newCountryId, setNewCountryId] = useState("");
  const [newCountryName, setNewCountryName] = useState("");
  const [newCountryFlag, setNewCountryFlag] = useState("");
  const [newCountryCurrency, setNewCountryCurrency] = useState("");
  const [newCountryWorkingHours, setNewCountryWorkingHours] = useState(40);
  const [newCountryStatus, setNewCountryStatus] = useState<Country["status"]>("Draft");
  const [newCountryRisk, setNewCountryRisk] = useState<Country["riskLevel"]>("Low");

  const handleAddCountrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCountryId || !newCountryName || !newCountryFlag || !newCountryCurrency) {
      alert("Please fill in all required fields.");
      return;
    }

    const newCountry: Country = {
      id: newCountryId.trim().toLowerCase(),
      name: newCountryName.trim(),
      flag: newCountryFlag.trim(),
      currency: newCountryCurrency.trim(),
      workingHours: Number(newCountryWorkingHours) || 40,
      taxRules: "Progressive personal income tax schedules & corporate withholding.",
      overtimePolicy: "1.5x baseline rate on weekdays; 2.0x baseline rate on public holidays.",
      leavePolicy: "14 Days Statutory Leaves; 12 Days Sick Leaves.",
      holidayCalendar: "National gazetted holidays & regional bank closures.",
      payrollCalendar: "Monthly pay period ending last day of month. Final sign-off required by 25th.",
      workflow: ["Input Ingestion", "Compliance Run", "SLA Sign-off", "Bank Release"],
      readinessScore: 80,
      complianceScore: 100,
      dataQualityScore: 90,
      status: newCountryStatus,
      riskLevel: newCountryRisk
    };

    try {
      const res = await fetch("/api/countries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCountry)
      });
      if (!res.ok) throw new Error("Failed to add new country entity.");
      
      // Update local state
      setCountries([...countries, newCountry]);
      setSelectedCountryId(newCountry.id);
      setOpenAddCountryModal(false);
      
      // Reset form
      setNewCountryId("");
      setNewCountryName("");
      setNewCountryFlag("");
      setNewCountryCurrency("");
      setNewCountryWorkingHours(40);
      setNewCountryStatus("Draft");
      setNewCountryRisk("Low");
    } catch (err: any) {
      alert(err.message || "Error saving country.");
    }
  };

  // Form states
  const activeCountry = countries.find(c => c.id === selectedCountryId) || countries[0];
  const [workingHours, setWorkingHours] = useState(activeCountry?.workingHours || 40);
  const [taxRules, setTaxRules] = useState(activeCountry?.taxRules || "");
  const [overtimePolicy, setOvertimePolicy] = useState(activeCountry?.overtimePolicy || "");
  const [leavePolicy, setLeavePolicy] = useState(activeCountry?.leavePolicy || "");
  const [holidayCalendar, setHolidayCalendar] = useState(activeCountry?.holidayCalendar || "");
  const [payrollCalendar, setPayrollCalendar] = useState(activeCountry?.payrollCalendar || "");
  const [currency, setCurrency] = useState(activeCountry?.currency || "");

  // Update form fields when selected country changes
  React.useEffect(() => {
    if (activeCountry) {
      setWorkingHours(activeCountry.workingHours);
      setTaxRules(activeCountry.taxRules);
      setOvertimePolicy(activeCountry.overtimePolicy);
      setLeavePolicy(activeCountry.leavePolicy);
      setHolidayCalendar(activeCountry.holidayCalendar);
      setPayrollCalendar(activeCountry.payrollCalendar);
      setCurrency(activeCountry.currency);
    }
  }, [selectedCountryId, countries]);

  const handleSave = async () => {
    if (!activeCountry) return;
    setIsSaving(true);

    try {
      // 1. Write updates directly to Firebase Firestore `Countries` collection
      const docRef = doc(db, "Countries", activeCountry.id);
      await updateDoc(docRef, {
        workingHours,
        taxRules,
        overtimePolicy,
        leavePolicy,
        holidayCalendar,
        payrollCalendar,
        currency
      });

      // 2. Reflect updates in the local parent state
      const updatedCountries = countries.map(c => {
        if (c.id === activeCountry.id) {
          return {
            ...c,
            workingHours,
            taxRules,
            overtimePolicy,
            leavePolicy,
            holidayCalendar,
            payrollCalendar,
            currency
          };
        }
        return c;
      });
      setCountries(updatedCountries);

      alert(`✓ Rules for ${activeCountry.name} updated and persisted successfully! Final calculations and validation engines updated in real-time.`);
    } catch (e) {
      console.error("Firestore Update Error:", e);
      alert("Error saving rules to Firebase database.");
    } finally {
      setIsSaving(false);
    }
  };

  const isDark = theme === "dark";

  return (
    <div className="space-y-4" id="country_rules_view_container">
      {/* Selector layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Country Selector sidebar */}
        <div className={`p-3.5 rounded-md border flex flex-col gap-1.5 ${
          isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"
        }`}>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Entity Jurisdictions</h3>
          {countries.map((c) => (
            <button
              key={c.id}
              id={`rule_select_btn_${c.id}`}
              onClick={() => setSelectedCountryId(c.id)}
              className={`p-2 rounded text-left flex items-center justify-between text-xs transition-all border ${
                selectedCountryId === c.id
                  ? (isDark ? "bg-[#2D2D2D] border-[#0078D4] text-white font-bold" : "bg-[#EFF6FC] border-[#0078D4] text-[#0078D4] font-bold")
                  : (isDark ? "bg-[#1F1F1F] border-transparent hover:bg-[#2D2D2D] text-slate-300" : "bg-white border-transparent hover:bg-[#F3F2F1] text-slate-700")
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-base">{c.flag}</span>
                <span>{c.name}</span>
              </div>
              <span className="text-[9.5px] font-mono text-slate-400">{c.currency.split(" ")[0]}</span>
            </button>
          ))}

          {/* Plug & Play expansion */}
          <button
            onClick={() => setOpenAddCountryModal(true)}
            className="mt-3 p-1.5 border border-dashed border-[#EDEBE9] dark:border-slate-700 rounded text-center text-xs text-[#0078D4] hover:border-[#0078D4] transition-all flex items-center justify-center gap-1.5 font-bold bg-slate-50/20 w-full"
          >
            <Plus size={12} /> Add Country Entity
          </button>
        </div>

        {/* Rule pack editor */}
        <div className="lg:col-span-3 space-y-3">
          <div className={`p-3.5 rounded-md border space-y-4 ${
            isDark ? "bg-[#1F1F1F] border-[#2D2D2D] text-white" : "bg-white border-[#EDEBE9] text-slate-800 shadow-sm"
          }`}>
            <div className="flex items-center justify-between border-b border-[#EDEBE9]/40 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{activeCountry?.flag}</span>
                <div>
                  <h3 className="text-xs font-bold text-[#323130] dark:text-white">{activeCountry?.name} Statutory Rule Pack</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Edit variables to re-calibrate AI Validation thresholds.</p>
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving}
                id="btn_save_rule_pack"
                className="px-3 py-1 bg-[#0078D4] hover:bg-[#005A9E] transition text-white text-xs font-bold rounded flex items-center gap-1 shadow-sm"
              >
                <Save size={12} /> {isSaving ? "Saving..." : "Save Rule Pack"}
              </button>
            </div>

            {/* Config Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Working hours slider */}
              <div className={`p-3 rounded border ${isDark ? "bg-[#2D2D2D]/20 border-[#2D2D2D]" : "bg-[#FAF9F8] border-[#EDEBE9]"}`}>
                <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 mb-1.5">
                  <Clock size={12} />
                  Statutory Working Hours Limit
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="35"
                    max="48"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(parseInt(e.target.value))}
                    className="flex-1 accent-[#0078D4]"
                  />
                  <span className="text-[11px] font-bold font-mono bg-[#0078D4]/10 text-[#0078D4] px-2 py-0.5 rounded">
                    {workingHours} hrs/wk
                  </span>
                </div>
              </div>

              {/* Currency */}
              <div className={`p-3 rounded border ${isDark ? "bg-[#2D2D2D]/20 border-[#2D2D2D]" : "bg-[#FAF9F8] border-[#EDEBE9]"}`}>
                <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 mb-1.5">
                  <DollarSign size={12} />
                  Active Trading Currency Code
                </label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={`w-full text-xs px-2 py-1 rounded border outline-none font-mono ${
                    isDark ? "bg-[#1F1F1F] border-[#2D2D2D] focus:border-[#0078D4]" : "bg-white border-[#EDEBE9] focus:border-[#0078D4]"
                  }`}
                />
              </div>

              {/* Taxation Rule Pack */}
              <div className={`p-3 rounded border md:col-span-2 ${isDark ? "bg-[#2D2D2D]/20 border-[#2D2D2D]" : "bg-[#FAF9F8] border-[#EDEBE9]"}`}>
                <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 mb-1.5">
                  <Sliders size={12} />
                  Taxation & Statutory Contribution Brackets
                </label>
                <textarea
                  rows={3}
                  value={taxRules}
                  onChange={(e) => setTaxRules(e.target.value)}
                  className={`w-full text-xs px-2 py-1 rounded border outline-none leading-relaxed ${
                    isDark ? "bg-[#1F1F1F] border-[#2D2D2D] focus:border-[#0078D4]" : "bg-white border-[#EDEBE9] focus:border-[#0078D4]"
                  }`}
                />
              </div>

              {/* Overtime statutory */}
              <div className={`p-3 rounded border md:col-span-2 ${isDark ? "bg-[#2D2D2D]/20 border-[#2D2D2D]" : "bg-[#FAF9F8] border-[#EDEBE9]"}`}>
                <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 mb-1.5">
                  <FileText size={12} />
                  Overtime Premium & Compliance Thresholds
                </label>
                <textarea
                  rows={3}
                  value={overtimePolicy}
                  onChange={(e) => setOvertimePolicy(e.target.value)}
                  className={`w-full text-xs px-2 py-1 rounded border outline-none leading-relaxed ${
                    isDark ? "bg-[#1F1F1F] border-[#2D2D2D] focus:border-[#0078D4]" : "bg-white border-[#EDEBE9] focus:border-[#0078D4]"
                  }`}
                />
              </div>

              {/* Leave statutory */}
              <div className={`p-3 rounded border ${isDark ? "bg-[#2D2D2D]/20 border-[#2D2D2D]" : "bg-[#FAF9F8] border-[#EDEBE9]"}`}>
                <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 mb-1.5">
                  <FileText size={12} />
                  Leave Policies
                </label>
                <textarea
                  rows={2}
                  value={leavePolicy}
                  onChange={(e) => setLeavePolicy(e.target.value)}
                  className={`w-full text-xs px-2 py-1 rounded border outline-none leading-relaxed ${
                    isDark ? "bg-[#1F1F1F] border-[#2D2D2D] focus:border-[#0078D4]" : "bg-white border-[#EDEBE9] focus:border-[#0078D4]"
                  }`}
                />
              </div>

              {/* Holiday */}
              <div className={`p-3 rounded border ${isDark ? "bg-[#2D2D2D]/20 border-[#2D2D2D]" : "bg-[#FAF9F8] border-[#EDEBE9]"}`}>
                <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 mb-1.5">
                  <Calendar size={12} />
                  Statutory Public Holidays
                </label>
                <textarea
                  rows={2}
                  value={holidayCalendar}
                  onChange={(e) => setHolidayCalendar(e.target.value)}
                  className={`w-full text-xs px-2 py-1 rounded border outline-none leading-relaxed ${
                    isDark ? "bg-[#1F1F1F] border-[#2D2D2D] focus:border-[#0078D4]" : "bg-white border-[#EDEBE9] focus:border-[#0078D4]"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {openAddCountryModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" id="add-country-dialog">
          <div className="flex items-center justify-center min-h-screen p-4 text-center">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={() => setOpenAddCountryModal(false)}></div>

            {/* Content container */}
            <div className={`relative rounded-2xl max-w-lg w-full p-6 text-left shadow-xl transform transition-all border ${isDark ? "bg-[#1E1E1E] border-[#2D2D2D] text-white" : "bg-white border-slate-100 text-slate-800"}`}>
              <div className={`flex justify-between items-center pb-4 border-b ${isDark ? "border-[#2D2D2D]" : "border-slate-100"}`}>
                <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Add New Country Entity</h3>
                <button onClick={() => setOpenAddCountryModal(false)} className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddCountrySubmit} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Country Code (ID) *</label>
                    <input
                      type="text"
                      placeholder="e.g. ca"
                      required
                      value={newCountryId}
                      onChange={(e) => setNewCountryId(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D] text-white" : "bg-white border-slate-200 text-slate-700"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Country Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Canada"
                      required
                      value={newCountryName}
                      onChange={(e) => setNewCountryName(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D] text-white" : "bg-white border-slate-200 text-slate-700"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Flag Emoji *</label>
                    <input
                      type="text"
                      placeholder="e.g. 🇨🇦"
                      required
                      value={newCountryFlag}
                      onChange={(e) => setNewCountryFlag(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D] text-white" : "bg-white border-slate-200 text-slate-700"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Currency Code *</label>
                    <input
                      type="text"
                      placeholder="e.g. CAD ($)"
                      required
                      value={newCountryCurrency}
                      onChange={(e) => setNewCountryCurrency(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D] text-white" : "bg-white border-slate-200 text-slate-700"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Statutory Work Hours Limit *</label>
                    <input
                      type="number"
                      min="1"
                      max="168"
                      required
                      value={newCountryWorkingHours}
                      onChange={(e) => setNewCountryWorkingHours(Number(e.target.value))}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D] text-white" : "bg-white border-slate-200 text-slate-700"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Compliance Risk Level *</label>
                    <select
                      value={newCountryRisk}
                      onChange={(e) => setNewCountryRisk(e.target.value as Country["riskLevel"])}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D] text-white [background-color:#1F1F1F]" : "bg-white border-slate-200 text-slate-700"}`}
                    >
                      <option value="Low">Low Risk</option>
                      <option value="Medium">Medium Risk</option>
                      <option value="High">High Risk</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Statutory Onboarding Status *</label>
                  <select
                    value={newCountryStatus}
                    onChange={(e) => setNewCountryStatus(e.target.value as Country["status"])}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D] text-white [background-color:#1F1F1F]" : "bg-white border-slate-200 text-slate-700"}`}
                  >
                    <option value="Draft">Draft Configuration</option>
                    <option value="Pending Approval">Pending SLA Approval</option>
                    <option value="Validating">Active Compliance Run</option>
                    <option value="Completed">Completed Onboarding</option>
                  </select>
                </div>

                <div className={`flex justify-end gap-3 pt-4 border-t ${isDark ? "border-[#2D2D2D]" : "border-slate-100"}`}>
                  <button
                    type="button"
                    onClick={() => setOpenAddCountryModal(false)}
                    className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors cursor-pointer ${isDark ? "border-[#2D2D2D] text-slate-300 hover:bg-[#252525]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-sm font-medium shadow-sm transition-colors cursor-pointer"
                  >
                    Add Entity
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
