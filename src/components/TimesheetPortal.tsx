import React, { useState, useEffect } from "react";
import { useLocalization } from "./LocalizationContext";
import {
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Building2,
  User,
  RefreshCw,
  X,
  BadgeAlert
} from "lucide-react";

interface Timesheet {
  "PS Number": string;
  "Employee Name": string;
  Date: string;
  "Total Hours": number;
  "OT Hours": number;
  "Approval Status": string;
  "Client Name": string;
}

interface TimesheetPortalProps {
  theme: "dark" | "light";
}

export default function TimesheetPortal({ theme }: TimesheetPortalProps) {
  const { t } = useLocalization();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");

  // Form modal state
  const [openModal, setOpenModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [formValues, setFormValues] = useState({
    psNumber: "",
    employeeName: "",
    date: new Date().toISOString().split("T")[0],
    totalHours: 8,
    otHours: 0,
    clientName: "",
    approvalStatus: "Pending"
  });

  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/timesheets");
      if (!res.ok) throw new Error("Failed to load timesheets");
      const data = await res.json();
      setTimesheets(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error connecting to the timesheet database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimesheets();
  }, []);

  const handleOpenModal = () => {
    setFormValues({
      psNumber: "",
      employeeName: "",
      date: new Date().toISOString().split("T")[0],
      totalHours: 8,
      otHours: 0,
      clientName: "",
      approvalStatus: "Pending"
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: name === "totalHours" || name === "otHours" ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.psNumber || !formValues.employeeName || !formValues.clientName) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const payload = {
        "PS Number": formValues.psNumber,
        "Employee Name": formValues.employeeName,
        Date: formValues.date,
        "Total Hours": formValues.totalHours,
        "OT Hours": formValues.otHours,
        "Approval Status": formValues.approvalStatus,
        "Client Name": formValues.clientName
      };

      const res = await fetch("/api/timesheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to submit timesheet record");
      
      setSuccessMsg("Client Timesheet submitted successfully! Seeded and dynamic validations updated.");
      setOpenModal(false);
      fetchTimesheets();
      
      setTimeout(() => {
        setSuccessMsg(null);
      }, 5000);
    } catch (err: any) {
      alert(err.message || "Could not save timesheet.");
    }
  };

  // Distinct clients list
  const clientOptions = Array.from(
    new Set(timesheets.map((ts) => ts["Client Name"]).filter(Boolean))
  );

  // Filtered timesheets
  const filteredTimesheets = timesheets.filter((ts) => {
    const matchSearch =
      (ts["Employee Name"] || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ts["PS Number"] || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchStatus =
      statusFilter === "all" ||
      (ts["Approval Status"] || "").toLowerCase() === statusFilter.toLowerCase();

    const matchClient =
      clientFilter === "all" ||
      (ts["Client Name"] || "").toLowerCase() === clientFilter.toLowerCase();

    return matchSearch && matchStatus && matchClient;
  });

  // Calculate metrics
  const totalRegularHours = filteredTimesheets.reduce((acc, curr) => acc + Number(curr["Total Hours"] || 0), 0);
  const totalOTHours = filteredTimesheets.reduce((acc, curr) => acc + Number(curr["OT Hours"] || 0), 0);
  const pendingCount = filteredTimesheets.filter(ts => (ts["Approval Status"] || "").toLowerCase() === "pending").length;
  const approvedCount = filteredTimesheets.filter(ts => (ts["Approval Status"] || "").toLowerCase() === "approved").length;

  const getStatusBadge = (status: string) => {
    const cleanStatus = (status || "").toLowerCase();
    switch (cleanStatus) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={13} /> Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={13} /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle size={13} /> Pending Sign-off
          </span>
        );
    }
  };

  const isDark = theme === "dark";

  return (
    <div id="timesheet-portal-root" className={`p-6 min-h-screen transition-colors duration-200 ${isDark ? "bg-[#161616] text-[#E2E8F0]" : "bg-slate-50 text-slate-800"}`}>
      {/* Title section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 id="title-timesheet" className={`text-3xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
            Client Timesheet Portal
          </h1>
          <p id="subtitle-timesheet" className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Enterprise multi-tenant client allocation timesheets, overtime tracking, and approval governance.
          </p>
        </div>
        <button
          id="btn-add-timesheet"
          onClick={handleOpenModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Plus size={18} /> Submit Client Timesheet
        </button>
      </div>

      {successMsg && (
        <div id="alert-success" className={`mb-6 p-4 border rounded-lg flex items-start gap-3 ${isDark ? "bg-emerald-950/20 border-emerald-900/50 text-emerald-300" : "bg-emerald-50 border-emerald-200 text-emerald-800"}`}>
          <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {error && (
        <div id="alert-error" className={`mb-6 p-4 border rounded-lg flex items-start gap-3 ${isDark ? "bg-rose-950/20 border-rose-900/50 text-rose-300" : "bg-rose-50 border-rose-200 text-rose-800"}`}>
          <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div id="kpi-total-hours" className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${isDark ? "bg-[#1E1E1E] border-[#2D2D2D]" : "bg-white border-slate-200"}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Regular Hours</span>
            <Clock className="text-blue-500" size={20} />
          </div>
          <div className="mt-2">
            <h3 className={`text-3xl font-extrabold ${isDark ? "text-white" : "text-slate-900"}`}>{loading ? "..." : totalRegularHours.toLocaleString()}h</h3>
            <span className="text-xs text-slate-400 mt-1 block">Direct client working hours</span>
          </div>
        </div>

        <div id="kpi-ot-hours" className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${isDark ? "bg-[#1E1E1E] border-[#2D2D2D]" : "bg-white border-slate-200"}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Premium Overtime Hours</span>
            <Clock className="text-rose-500" size={20} />
          </div>
          <div className="mt-2">
            <h3 className="text-3xl font-extrabold text-rose-600">{loading ? "..." : totalOTHours.toLocaleString()}h</h3>
            <span className="text-xs text-slate-400 mt-1 block">Eligible for 2.0x/1.5x payout rate</span>
          </div>
        </div>

        <div id="kpi-approved" className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${isDark ? "bg-[#1E1E1E] border-[#2D2D2D]" : "bg-white border-slate-200"}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Approved Records</span>
            <CheckCircle2 className="text-emerald-500" size={20} />
          </div>
          <div className="mt-2">
            <h3 className="text-3xl font-extrabold text-emerald-600">{loading ? "..." : approvedCount}</h3>
            <span className="text-xs text-slate-400 mt-1 block">Ready for active payroll calculation</span>
          </div>
        </div>

        <div id="kpi-pending" className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${isDark ? "bg-[#1E1E1E] border-[#2D2D2D]" : "bg-white border-slate-200"}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Review</span>
            <AlertCircle className="text-amber-500" size={20} />
          </div>
          <div className="mt-2">
            <h3 className="text-3xl font-extrabold text-amber-500">{loading ? "..." : pendingCount}</h3>
            <span className="text-xs text-slate-400 mt-1 block">Awaiting operations certification</span>
          </div>
        </div>
      </div>

      {/* Filter and Table Container Card */}
      <div id="timesheets-container" className={`rounded-2xl border shadow-sm overflow-hidden ${isDark ? "bg-[#1E1E1E] border-[#2D2D2D]" : "bg-white border-slate-200"}`}>
        <div className={`p-5 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${isDark ? "border-[#2D2D2D]" : "border-slate-100"}`}>
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search size={18} />
            </span>
            <input
              id="search-input"
              type="text"
              placeholder="Search by Employee or PS Number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D] text-white" : "bg-white border-slate-200 text-slate-700"}`}
            />
          </div>

          {/* Filters dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-slate-50 border-slate-200"}`}>
              <span className="text-xs font-medium text-slate-400">Status:</span>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`bg-transparent text-sm font-medium focus:outline-none cursor-pointer outline-none ${isDark ? "text-white [background-color:#1F1F1F]" : "text-slate-700"}`}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-slate-50 border-slate-200"}`}>
              <span className="text-xs font-medium text-slate-400">Client:</span>
              <select
                id="filter-client"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className={`bg-transparent text-sm font-medium focus:outline-none cursor-pointer outline-none ${isDark ? "text-white [background-color:#1F1F1F]" : "text-slate-700"}`}
              >
                <option value="all">All Clients</option>
                {clientOptions.map((cli) => (
                  <option key={cli} value={cli.toLowerCase()}>
                    {cli}
                  </option>
                ))}
              </select>
            </div>

            <button
              id="btn-reset-filters"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setClientFilter("all");
              }}
              className={`px-3.5 py-1.5 border rounded-lg text-sm font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${isDark ? "border-[#2D2D2D] text-slate-300 hover:bg-[#252525]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              <Filter size={14} /> Reset
            </button>
          </div>
        </div>

        {/* Table representation */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <RefreshCw className="animate-spin text-blue-500" size={32} />
            <span className="text-sm font-medium">Loading client timesheets from database...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table id="timesheet-table" className="w-full text-left border-collapse">
              <thead>
                <tr className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "bg-[#1A1A1A] border-b border-[#2D2D2D] text-slate-400" : "bg-slate-50 border-b border-slate-100 text-slate-400"}`}>
                  <th className="px-6 py-4">PS Number</th>
                  <th className="px-6 py-4">Employee Name</th>
                  <th className="px-6 py-4">Client Name</th>
                  <th className="px-6 py-4">Allocated Date</th>
                  <th className="px-6 py-4 text-right">Regular Hours</th>
                  <th className="px-6 py-4 text-right">Overtime Hours</th>
                  <th className="px-6 py-4 text-center">Governance Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-sm font-medium ${isDark ? "divide-[#2D2D2D] text-slate-300" : "divide-slate-100 text-slate-700"}`}>
                {filteredTimesheets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={`text-center py-16 text-slate-400 ${isDark ? "bg-[#1E1E1E]" : "bg-white"}`}>
                      No matching client timesheet records located.
                    </td>
                  </tr>
                ) : (
                  filteredTimesheets.map((row, idx) => (
                    <tr key={idx} className={`transition-colors ${isDark ? "hover:bg-[#252525]" : "hover:bg-slate-50/50"}`}>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{row["PS Number"]}</td>
                      <td className={`px-6 py-4 font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{row["Employee Name"]}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-slate-400">
                          <Building2 size={14} />
                          <span className={`${isDark ? "text-slate-300" : "text-slate-600"}`}>{row["Client Name"]}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{row["Date"]}</td>
                      <td className="px-6 py-4 text-right font-semibold">{row["Total Hours"]} hrs</td>
                      <td className={`px-6 py-4 text-right font-semibold ${Number(row["OT Hours"]) > 0 ? "text-rose-600" : "text-slate-500"}`}>
                        {row["OT Hours"]} hrs
                      </td>
                      <td className="px-6 py-4 text-center">{getStatusBadge(row["Approval Status"])}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal dialog for submitting timesheet */}
      {openModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" id="add-timesheet-dialog">
          <div className="flex items-center justify-center min-h-screen p-4 text-center">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={handleCloseModal}></div>

            {/* Content container */}
            <div className={`relative rounded-2xl max-w-lg w-full p-6 text-left shadow-xl transform transition-all border ${isDark ? "bg-[#1E1E1E] border-[#2D2D2D]" : "bg-white border-slate-100"}`}>
              <div className={`flex justify-between items-center pb-4 border-b ${isDark ? "border-[#2D2D2D]" : "border-slate-100"}`}>
                <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Submit New Client Timesheet Record</h3>
                <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Employee PS Number *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User size={15} />
                      </span>
                      <input
                        type="text"
                        name="psNumber"
                        placeholder="e.g. PS103591"
                        required
                        value={formValues.psNumber}
                        onChange={handleChange}
                        className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D] text-white" : "bg-white border-slate-200 text-slate-700"}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Employee Full Name *</label>
                    <input
                      type="text"
                      name="employeeName"
                      placeholder="e.g. Emp 103591"
                      required
                      value={formValues.employeeName}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D] text-white" : "bg-white border-slate-200 text-slate-700"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Allocated Client Name *</label>
                    <input
                      type="text"
                      name="clientName"
                      placeholder="e.g. Client-Y"
                      required
                      value={formValues.clientName}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D] text-white" : "bg-white border-slate-200 text-slate-700"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Allocated Date *</label>
                    <input
                      type="date"
                      name="date"
                      required
                      value={formValues.date}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D] text-white" : "bg-white border-slate-200 text-slate-700"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Regular Hours Worked *</label>
                    <input
                      type="number"
                      name="totalHours"
                      min="0"
                      max="24"
                      required
                      value={formValues.totalHours}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D] text-white" : "bg-white border-slate-200 text-slate-700"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Overtime Hours Worked *</label>
                    <input
                      type="number"
                      name="otHours"
                      min="0"
                      max="24"
                      required
                      value={formValues.otHours}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D] text-white" : "bg-white border-slate-200 text-slate-700"}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Approval / Governance Status *</label>
                  <select
                    name="approvalStatus"
                    required
                    value={formValues.approvalStatus}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D] text-white" : "bg-white border-slate-200 text-slate-700"}`}
                  >
                    <option value="Pending">Pending Operational Sign-off</option>
                    <option value="Approved">Approved / Consolidated</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className={`flex justify-end gap-3 pt-4 border-t ${isDark ? "border-[#2D2D2D]" : "border-slate-100"}`}>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors cursor-pointer ${isDark ? "border-[#2D2D2D] text-slate-300 hover:bg-[#252525]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-sm font-medium shadow-sm transition-colors cursor-pointer"
                  >
                    Submit Record
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
