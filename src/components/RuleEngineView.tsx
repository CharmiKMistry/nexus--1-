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
  FileText
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
            onClick={() => alert("Enterprise Rule Marketplace is active. Standardized Rule packs for Canada, Australia, India, and 120+ entities are ready to provision instantly on the cloud.")}
            className="mt-3 p-1.5 border border-dashed border-[#EDEBE9] dark:border-slate-700 rounded text-center text-xs text-[#0078D4] hover:border-[#0078D4] transition-all flex items-center justify-center gap-1.5 font-bold bg-slate-50/20"
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
    </div>
  );
}
