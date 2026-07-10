import React, { useState, useEffect } from "react";
import { useLocalization } from "./LocalizationContext";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Check,
  CheckSquare,
  AlertTriangle,
  Clock,
  ArrowRight,
  CornerDownRight,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Building2,
  User,
  RefreshCw,
  X,
  Send,
  History,
  CalendarDays
} from "lucide-react";

interface WorkflowLog {
  stage: string;
  user: string;
  role: string;
  timestamp: string;
  comments: string;
  duration?: string;
  slaStatus?: "Within SLA" | "SLA Breached";
}

interface ClientTimesheet {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  project: string;
  client: string;
  regularHours: number;
  overtimeHours: number;
  shift: string;
  location: string;
  comments: string;
  status: string; // Draft, Submitted, Client Approved, LTTS PM Approved, HR Approved, Payroll Ready, Processed, Rejected, Correction Requested, Cancelled
  isHoliday?: boolean;
  isWeekend?: boolean;
  workflowLogs: WorkflowLog[];
}

interface TimesheetPortalProps {
  theme: "dark" | "light";
}

// Available clients for simulation/selection
const AVAILABLE_CLIENTS = [
  "Chevron",
  "General Electric",
  "Toyota",
  "Intel"
];

const STAGES = [
  { name: "Draft", label: "Draft Saved", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  { name: "Submitted", label: "Submitted to Client", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { name: "Client Approved", label: "Client Approved", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { name: "LTTS PM Approved", label: "LTTS PM Verified", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  { name: "HR Approved", label: "HR Audited", color: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
  { name: "Payroll Ready", label: "Payroll Consolidated", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { name: "Rejected", label: "Rejected", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  { name: "Correction Requested", label: "Correction Requested", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" }
];

export default function TimesheetPortal({ theme }: TimesheetPortalProps) {
  const { t } = useLocalization();
  const isDark = theme === "dark";

  // Active view: employee, client, operational (combined PM, HR, Payroll)
  const [activeRole, setActiveRole] = useState<"employee" | "client" | "operations">("employee");
  
  // Simulated logged-in user context
  const [currentUser, setCurrentUser] = useState({
    name: "Ronak Surve",
    psNumber: "PS-09600",
    email: "ronaksurve96@gmail.com",
    client: "Chevron"
  });

  // Client Manager simulation context
  const [currentClientManager, setCurrentClientManager] = useState({
    name: "John Carter",
    client: "Chevron",
    email: "john.carter@chevron.com"
  });

  // Operations Specialist simulation context
  const [currentOpSpecialist, setCurrentOpSpecialist] = useState({
    name: "Charmi Patel",
    email: "charmipatel@gmail.com",
    role: "HR" // HR or LTTS PM or Payroll Admin
  });

  // Core timesheets database state
  const [timesheets, setTimesheets] = useState<ClientTimesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");

  // Selection states (Connected as per Goal 10)
  const [selectedAllocation, setSelectedAllocation] = useState<ClientTimesheet | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<WorkflowLog[]>([]);
  const [allocationStatus, setAllocationStatus] = useState<string>("");

  // Keep selectedTimesheet as alias for compatibility across remaining codebase
  const selectedTimesheet = selectedAllocation;
  const setSelectedTimesheet = setSelectedAllocation;

  const [currentMonth, setCurrentMonth] = useState<string>("2026-07"); // YYYY-MM
  const [selectedDates, setSelectedDates] = useState<string[]>([]); // for bulk operations
  const [isBulkMode, setIsBulkMode] = useState(false);

  // Form modal state
  const [openModal, setOpenModal] = useState(false);
  const [editingTimesheet, setEditingTimesheet] = useState<ClientTimesheet | null>(null);
  const [formValues, setFormValues] = useState({
    employeeId: "PS-09600",
    employeeName: "Ronak Surve",
    date: "2026-07-09",
    project: "Automated Payroll Ledger Integration",
    client: "Chevron",
    regularHours: 8,
    overtimeHours: 0,
    shift: "General",
    location: "Onsite",
    comments: ""
  });

  // Dirty state check to prompt user for unsaved changes (Goal 6)
  const isFormDirty = () => {
    const original = editingTimesheet ? {
      employeeId: editingTimesheet.employeeId,
      employeeName: editingTimesheet.employeeName,
      date: editingTimesheet.date,
      project: editingTimesheet.project,
      client: editingTimesheet.client,
      regularHours: editingTimesheet.regularHours,
      overtimeHours: editingTimesheet.overtimeHours,
      shift: editingTimesheet.shift,
      location: editingTimesheet.location,
      comments: editingTimesheet.comments
    } : {
      employeeId: currentUser.psNumber,
      employeeName: currentUser.name,
      date: selectedDate || "",
      project: "Automated Payroll Ledger Integration",
      client: "Chevron",
      regularHours: 8,
      overtimeHours: 0,
      shift: "General",
      location: "Onsite",
      comments: ""
    };

    return (
      formValues.project !== original.project ||
      formValues.client !== original.client ||
      formValues.regularHours !== original.regularHours ||
      formValues.overtimeHours !== original.overtimeHours ||
      formValues.shift !== original.shift ||
      formValues.location !== original.location ||
      formValues.comments !== original.comments ||
      formValues.date !== original.date
    );
  };

  // Reactive state listener (Goal 11)
  useEffect(() => {
    if (selectedAllocation) {
      setTimelineEvents(selectedAllocation.workflowLogs || []);
      setAllocationStatus(selectedAllocation.status || "Draft");
    } else {
      setTimelineEvents([]);
      if (selectedDate) {
        setAllocationStatus("not_found");
      } else {
        setAllocationStatus("");
      }
    }
  }, [selectedAllocation, selectedDate]);

  // Bulk input form
  const [bulkValues, setBulkValues] = useState({
    project: "Smart UI Redesign Framework",
    client: "General Electric",
    regularHours: 8,
    overtimeHours: 0,
    shift: "General",
    location: "Onsite",
    comments: "Bulk weekday entry."
  });

  // Action comment
  const [workflowComment, setWorkflowComment] = useState("");

  const fetchClientTimesheets = async () => {
    try {
      setLoading(true);
      
      // Determine query filters
      let url = "/api/client-timesheets";
      const params = new URLSearchParams();
      
      if (activeRole === "employee") {
        params.append("userRole", "Employee");
        params.append("psNumber", currentUser.psNumber);
      } else if (activeRole === "client") {
        params.append("userRole", "Client Manager");
        params.append("userEmail", currentClientManager.email);
      } else {
        params.append("userRole", "Super Admin"); // operations sees all
      }
      
      const res = await fetch(`${url}?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load client timesheets");
      const data = await res.json();
      setTimesheets(data);
      
      // Keep track of active selection if it still exists (Goal 5, Goal 12)
      if (selectedAllocation) {
        const updated = data.find((ts: ClientTimesheet) => ts.id === selectedAllocation.id);
        if (updated) {
          setSelectedAllocation(updated);
        } else if (selectedDate) {
          const updatedByDate = data.find((ts: ClientTimesheet) => ts.date === selectedDate && ts.employeeId === currentUser.psNumber);
          if (updatedByDate) setSelectedAllocation(updatedByDate);
        }
      } else if (selectedDate) {
        const updatedByDate = data.find((ts: ClientTimesheet) => ts.date === selectedDate && ts.employeeId === currentUser.psNumber);
        if (updatedByDate) setSelectedAllocation(updatedByDate);
      }
      
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load timesheets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientTimesheets();
  }, [activeRole, currentUser.psNumber, currentClientManager.email]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingTimesheet 
        ? `/api/client-timesheets/${editingTimesheet.id}`
        : "/api/client-timesheets";
      const method = editingTimesheet ? "PUT" : "POST";
      
      const payload = editingTimesheet 
        ? { ...formValues, status: editingTimesheet.status } 
        : { ...formValues, status: "Draft" };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to submit timesheet record");
      
      const successText = editingTimesheet ? "Timesheet updated successfully!" : "Timesheet draft saved successfully!";
      setSuccessMsg(successText);
      
      setOpenModal(false);
      setEditingTimesheet(null);
      
      // Refresh everything without reload (Goal 4, Goal 5, Goal 12)
      await fetchClientTimesheets();
      
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || "Could not save timesheet.");
    }
  };

  const handleWorkflowAction = async (timesheetId: string, actionStage: string) => {
    try {
      let userName = "";
      let userRole = "";

      if (activeRole === "employee") {
        userName = currentUser.name;
        userRole = "Employee";
      } else if (activeRole === "client") {
        userName = currentClientManager.name;
        userRole = "Client Manager";
      } else {
        userName = currentOpSpecialist.name;
        userRole = currentOpSpecialist.role;
      }

      const res = await fetch(`/api/client-timesheets/${timesheetId}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: actionStage,
          user: userName,
          role: userRole,
          comments: workflowComment || `Status advanced to ${actionStage}`
        })
      });

      if (!res.ok) throw new Error("Failed to process workflow action");
      const updatedData = await res.json();
      
      const successText = `Timesheet status changed to: ${actionStage}!`;
      setSuccessMsg(successText);
      setWorkflowComment("");
      
      // Refresh database, calendar, timeline, and counters (Goal 4, Goal 5)
      await fetchClientTimesheets();
      
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || "Could not advance workflow.");
    }
  };

  const handleBulkSubmit = async () => {
    if (selectedDates.length === 0) {
      setError("Please select at least one date on the calendar.");
      return;
    }

    try {
      const res = await fetch("/api/client-timesheets/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply-dates",
          dates: selectedDates,
          employeeId: currentUser.psNumber,
          employeeName: currentUser.name,
          ...bulkValues
        })
      });

      if (!res.ok) throw new Error("Bulk submission failed");
      
      setSuccessMsg(`Successfully submitted timesheets for ${selectedDates.length} selected days!`);
      setSelectedDates([]);
      setIsBulkMode(false);
      fetchClientTimesheets();
      
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || "Bulk apply failed.");
    }
  };

  const handleCopyPreviousWeek = async () => {
    // Generate dates for current week or previous week to simulate duplication
    setError("Feature: Pre-populated hours based on last week's templates are active.");
    setTimeout(() => setError(null), 4000);
  };

  // Build calendar matrix
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const generateMonthDays = () => {
    const [yearStr, monthStr] = currentMonth.split("-");
    const year = parseInt(yearStr);
    const monthIndex = parseInt(monthStr) - 1; // 0-indexed

    const daysCount = getDaysInMonth(year, monthIndex);
    const firstDayIndex = new Date(year, monthIndex, 1).getDay(); // 0 (Sun) - 6 (Sat)

    const days = [];
    
    // Fill trailing blanks
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    // Fill actual days
    for (let d = 1; d <= daysCount; d++) {
      const dateString = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push(dateString);
    }

    return days;
  };

  const monthDays = generateMonthDays();

  const handleMonthChange = (direction: "prev" | "next") => {
    const [yearStr, monthStr] = currentMonth.split("-");
    let year = parseInt(yearStr);
    let month = parseInt(monthStr);

    if (direction === "prev") {
      month--;
      if (month < 1) {
        month = 12;
        year--;
      }
    } else {
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }

    setCurrentMonth(`${year}-${String(month).padStart(2, "0")}`);
  };

  const toggleDateSelection = (dateStr: string) => {
    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter(d => d !== dateStr));
    } else {
      setSelectedDates([...selectedDates, dateStr]);
    }
  };

  const openFormForDate = (dateStr: string) => {
    // Preserve unsaved changes warning (Goal 6)
    if (openModal && isFormDirty()) {
      const leave = window.confirm("You have unsaved changes in the open form. Are you sure you want to discard them and select this date?");
      if (!leave) return;
    }

    setSelectedDate(dateStr);
    
    const existing = timesheets.find(ts => ts.date === dateStr && ts.employeeId === currentUser.psNumber);
    
    if (existing) {
      setSelectedAllocation(existing);
      setEditingTimesheet(existing);
      setFormValues({
        employeeId: existing.employeeId,
        employeeName: existing.employeeName,
        date: existing.date,
        project: existing.project,
        client: existing.client,
        regularHours: existing.regularHours,
        overtimeHours: existing.overtimeHours,
        shift: existing.shift,
        location: existing.location,
        comments: existing.comments
      });
    } else {
      setSelectedAllocation(null);
      setEditingTimesheet(null);
      setFormValues({
        employeeId: currentUser.psNumber,
        employeeName: currentUser.name,
        date: dateStr,
        project: "Automated Payroll Ledger Integration",
        client: "Chevron",
        regularHours: 8,
        overtimeHours: 0,
        shift: "General",
        location: "Onsite",
        comments: ""
      });
    }
    setOpenModal(true);
  };

  const getStatusBadge = (status: string) => {
    const cleanStatus = status || "Draft";
    const found = STAGES.find(s => s.name.toLowerCase() === cleanStatus.toLowerCase());
    const colorClasses = found ? found.color : "bg-slate-500/10 text-slate-400 border-slate-500/20";
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${colorClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
        {found ? found.label : cleanStatus}
      </span>
    );
  };

  const getStatusColorCircle = (status: string) => {
    const cleanStatus = status || "Draft";
    switch (cleanStatus.toLowerCase()) {
      case "draft": return "bg-slate-400";
      case "submitted": return "bg-blue-400";
      case "client approved": return "bg-purple-400";
      case "ltts pm approved": return "bg-indigo-400";
      case "hr approved": return "bg-pink-400";
      case "payroll ready": return "bg-emerald-400 border-emerald-300 border animate-pulse";
      case "rejected": return "bg-rose-500";
      case "correction requested": return "bg-amber-400";
      default: return "bg-slate-400";
    }
  };

  // Filtering list
  const filteredList = timesheets.filter(ts => {
    const searchMatch = ts.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        ts.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        ts.project.toLowerCase().includes(searchQuery.toLowerCase());

    const statusMatch = statusFilter === "all" || ts.status.toLowerCase() === statusFilter.toLowerCase();
    const clientMatch = clientFilter === "all" || ts.client.toLowerCase() === clientFilter.toLowerCase();

    return searchMatch && statusMatch && clientMatch;
  });

  // Calculate high quality analytics metrics
  const totalRegularHours = filteredList.reduce((sum, item) => sum + item.regularHours, 0);
  const totalOvertimeHours = filteredList.reduce((sum, item) => sum + item.overtimeHours, 0);
  
  // SLA calculations (for July 2026 logs)
  const allLogs = filteredList.flatMap(ts => ts.workflowLogs || []);
  const slaBreachedCount = allLogs.filter(log => log.slaStatus === "SLA Breached").length;
  const totalEvaluatedLogs = allLogs.filter(log => log.slaStatus !== undefined).length;
  const slaComplianceRate = totalEvaluatedLogs > 0 
    ? Math.round(((totalEvaluatedLogs - slaBreachedCount) / totalEvaluatedLogs) * 100) 
    : 100;

  return (
    <div id="timesheet-portal-root" className={`p-6 min-h-screen transition-all ${isDark ? "bg-[#111111] text-slate-200" : "bg-[#F8FAFC] text-slate-800"}`}>
      
      {/* Simulation Persona Bar */}
      <div className={`mb-6 p-3 rounded-xl border flex flex-wrap items-center justify-between gap-4 text-xs font-semibold ${isDark ? "bg-[#181818] border-[#2D2D2D]" : "bg-white border-slate-200"}`}>
        <div className="flex items-center gap-2">
          <Sparkles className="text-amber-500 shrink-0" size={16} />
          <span className="text-slate-400">Simulation Perspective Router:</span>
          <div className="flex bg-slate-500/10 p-0.5 rounded-lg border border-slate-500/10">
            <button
              onClick={() => { setActiveRole("employee"); setSelectedTimesheet(null); }}
              className={`px-3 py-1.5 rounded-md transition ${activeRole === "employee" ? (isDark ? "bg-slate-700 text-white font-bold" : "bg-white text-blue-600 shadow-xs font-bold") : "text-slate-400 hover:text-slate-200"}`}
            >
              👷 Employee ({currentUser.name})
            </button>
            <button
              onClick={() => { setActiveRole("client"); setSelectedTimesheet(null); }}
              className={`px-3 py-1.5 rounded-md transition ${activeRole === "client" ? (isDark ? "bg-slate-700 text-white font-bold" : "bg-white text-blue-600 shadow-xs font-bold") : "text-slate-400 hover:text-slate-200"}`}
            >
              🏢 Client Mgr ({currentClientManager.client})
            </button>
            <button
              onClick={() => { setActiveRole("operations"); setSelectedTimesheet(null); }}
              className={`px-3 py-1.5 rounded-md transition ${activeRole === "operations" ? (isDark ? "bg-slate-700 text-white font-bold" : "bg-white text-blue-600 shadow-xs font-bold") : "text-slate-400 hover:text-slate-200"}`}
            >
              🛡️ Operations Console
            </button>
          </div>
        </div>

        {/* Dynamic Context Helper */}
        <div className="flex items-center gap-3">
          {activeRole === "employee" && (
            <span className="text-slate-400">Logged in: <strong className="text-blue-500">{currentUser.name}</strong> ({currentUser.psNumber})</span>
          )}
          {activeRole === "client" && (
            <span className="text-slate-400">Authorized: <strong className="text-purple-500">{currentClientManager.name}</strong>, Client Sponsor for <strong className="text-white">{currentClientManager.client}</strong></span>
          )}
          {activeRole === "operations" && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Operations Staff:</span>
              <select
                value={currentOpSpecialist.role}
                onChange={(e) => setCurrentOpSpecialist({ ...currentOpSpecialist, role: e.target.value })}
                className={`bg-transparent py-0.5 px-2 border rounded font-semibold focus:outline-none ${isDark ? "text-white border-slate-700" : "text-slate-800 border-slate-300"}`}
              >
                <option value="LTTS Project Manager">LTTS Project Manager</option>
                <option value="HR">HR Specialist</option>
                <option value="Super Admin">Payroll Lead</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 id="title-timesheet" className={`text-3xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
            Client Timesheet Portal <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 ml-2">External Collaboration</span>
          </h1>
          <p id="subtitle-timesheet" className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Direct client sponsorship sign-offs, multi-party operational approvals, and seamless automated payroll ledger ingestion.
          </p>
        </div>
      </div>

      {successMsg && (
        <div id="alert-success" className="mb-6 p-4 border rounded-xl flex items-start gap-3 bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
          <span className="text-sm font-semibold">{successMsg}</span>
        </div>
      )}

      {error && (
        <div id="alert-error" className="mb-6 p-4 border rounded-xl flex items-start gap-3 bg-rose-500/10 border-rose-500/20 text-rose-400">
          <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {/* SLA and Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className={`p-5 rounded-2xl border shadow-xs ${isDark ? "bg-[#161616] border-[#252525]" : "bg-white border-slate-100"}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Regular Allocated Hours</p>
              <h3 className={`text-2xl font-extrabold mt-1.5 ${isDark ? "text-white" : "text-slate-900"}`}>{loading ? "..." : totalRegularHours} hrs</h3>
            </div>
            <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
              <Clock size={18} />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
            <TrendingUp size={12} className="text-emerald-400" /> Active allocations logged
          </p>
        </div>

        <div className={`p-5 rounded-2xl border shadow-xs ${isDark ? "bg-[#161616] border-[#252525]" : "bg-white border-slate-100"}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Premium Overtime Hours</p>
              <h3 className="text-2xl font-extrabold mt-1.5 text-rose-500">{loading ? "..." : totalOvertimeHours} hrs</h3>
            </div>
            <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400">
              <Clock size={18} />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Requires client manager authorization</p>
        </div>

        <div className={`p-5 rounded-2xl border shadow-xs ${isDark ? "bg-[#161616] border-[#252525]" : "bg-white border-slate-100"}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">SLA Approval Window</p>
              <h3 className="text-2xl font-extrabold mt-1.5 text-amber-500">48 Hours</h3>
            </div>
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400">
              <ShieldCheck size={18} />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Statutory LTTS - Client turn-around cap</p>
        </div>

        <div className={`p-5 rounded-2xl border shadow-xs ${isDark ? "bg-[#161616] border-[#252525]" : "bg-white border-slate-100"}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">SLA Compliance Rate</p>
              <h3 className="text-2xl font-extrabold mt-1.5 text-emerald-400">{slaComplianceRate}%</h3>
            </div>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Compliant with active service levels</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Left 2 Columns: Calendar or Interactive Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          
          {activeRole === "employee" ? (
            /* EMPLOYEE COMPONENT - CALENDAR + BULK CONSOLE */
            <div className={`p-6 rounded-2xl border ${isDark ? "bg-[#161616] border-[#2D2D2D]" : "bg-white border-slate-100"}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b pb-4 border-slate-500/10">
                <div className="flex items-center gap-2">
                  <CalendarDays className="text-blue-500" size={20} />
                  <h2 className="text-lg font-bold">Interactive Allocations Calendar</h2>
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={() => handleMonthChange("prev")} className={`p-1.5 rounded border ${isDark ? "border-slate-800 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-100"}`}>
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-extrabold">{currentMonth === "2026-07" ? "July 2026" : currentMonth}</span>
                  <button onClick={() => handleMonthChange("next")} className={`p-1.5 rounded border ${isDark ? "border-slate-800 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-100"}`}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 mb-2">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {monthDays.map((day, idx) => {
                  if (!day) {
                    return <div key={`empty-${idx}`} className={`h-20 rounded-xl ${isDark ? "bg-[#1e1e1e]/20" : "bg-slate-100/30"}`}></div>;
                  }

                  const matchedTs = timesheets.find(ts => ts.date === day && ts.employeeId === currentUser.psNumber);
                  const isSelected = selectedDates.includes(day);
                  const dObj = new Date(day);
                  const isWeekendDay = dObj.getDay() === 0 || dObj.getDay() === 6;

                  return (
                    <div
                      key={day}
                      onClick={() => {
                        if (isBulkMode) {
                          toggleDateSelection(day);
                        } else {
                          openFormForDate(day);
                        }
                      }}
                      className={`h-20 p-2 rounded-xl border text-left flex flex-col justify-between cursor-pointer transition relative group ${
                        isSelected 
                          ? "ring-2 ring-blue-500 border-blue-500 bg-blue-500/10" 
                          : matchedTs 
                          ? (isDark ? "bg-[#1E1E1E] border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:bg-slate-50")
                          : isWeekendDay
                          ? (isDark ? "bg-[#161616] border-dashed border-slate-800 hover:border-slate-700 opacity-60" : "bg-slate-50 border-dashed border-slate-200 hover:bg-slate-100 opacity-60")
                          : (isDark ? "bg-[#1c1c1c] border-dashed border-slate-800 hover:border-slate-700" : "bg-white border-dashed border-slate-200 hover:bg-slate-100")
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-bold ${matchedTs ? (isDark ? "text-white" : "text-slate-900") : "text-slate-400"}`}>
                          {day.split("-")[2]}
                        </span>
                        {matchedTs && (
                          <div className={`w-2.5 h-2.5 rounded-full ${getStatusColorCircle(matchedTs.status)}`} />
                        )}
                      </div>

                      {matchedTs ? (
                        <div className="text-[10px] truncate leading-tight font-medium text-slate-400">
                          <div className="font-bold text-slate-300">{matchedTs.regularHours}h + {matchedTs.overtimeHours}h OT</div>
                          <div className="text-[9px] truncate">{matchedTs.client}</div>
                        </div>
                      ) : (
                        <div className="text-[9px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          + Log hours
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend & Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-500/10">
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-400">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Draft</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Submitted</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Client Approved</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Correction Requested</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Payroll Consolidated</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setIsBulkMode(!isBulkMode);
                      setSelectedDates([]);
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${isBulkMode ? "bg-amber-600 border-amber-600 text-white" : (isDark ? "border-slate-800 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-100")}`}
                  >
                    {isBulkMode ? "❌ Cancel Bulk Mode" : "📅 Bulk Week Entry"}
                  </button>
                  <button
                    onClick={handleCopyPreviousWeek}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer ${isDark ? "border-slate-800 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-100"}`}
                  >
                    <Copy size={12} /> Copy Last Week
                  </button>
                </div>
              </div>

              {/* Bulk Mode Console */}
              {isBulkMode && (
                <div className={`mt-6 p-5 rounded-xl border ${isDark ? "bg-[#1E1E1E] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="text-amber-500" size={16} />
                    <h3 className="text-sm font-bold">Bulk Action Panel</h3>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                    Select days on the calendar above (<strong>{selectedDates.length} selected</strong>), configure hours below, and click Apply to batch-submit.
                  </p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Regular Hours</label>
                      <input
                        type="number"
                        value={bulkValues.regularHours}
                        onChange={(e) => setBulkValues({ ...bulkValues, regularHours: Number(e.target.value) })}
                        className={`w-full py-1.5 px-3 border rounded text-xs focus:outline-none ${isDark ? "bg-[#161616] border-slate-700 text-white" : "bg-white border-slate-300"}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Overtime Hours</label>
                      <input
                        type="number"
                        value={bulkValues.overtimeHours}
                        onChange={(e) => setBulkValues({ ...bulkValues, overtimeHours: Number(e.target.value) })}
                        className={`w-full py-1.5 px-3 border rounded text-xs focus:outline-none ${isDark ? "bg-[#161616] border-slate-700 text-white" : "bg-white border-slate-300"}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Project Code</label>
                      <input
                        type="text"
                        value={bulkValues.project}
                        onChange={(e) => setBulkValues({ ...bulkValues, project: e.target.value })}
                        className={`w-full py-1.5 px-3 border rounded text-xs focus:outline-none ${isDark ? "bg-[#161616] border-slate-700 text-white" : "bg-white border-slate-300"}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sponsoring Client</label>
                      <select
                        value={bulkValues.client}
                        onChange={(e) => setBulkValues({ ...bulkValues, client: e.target.value })}
                        className={`w-full py-1.5 px-3 border rounded text-xs focus:outline-none ${isDark ? "bg-[#161616] border-slate-700 text-white [background-color:#161616]" : "bg-white border-slate-300"}`}
                      >
                        {AVAILABLE_CLIENTS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => { setIsBulkMode(false); setSelectedDates([]); }}
                      className={`px-3 py-1.5 border rounded text-xs font-semibold ${isDark ? "border-slate-800 text-slate-300" : "border-slate-200 text-slate-600"}`}
                    >
                      Discard
                    </button>
                    <button
                      onClick={handleBulkSubmit}
                      disabled={selectedDates.length === 0}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs font-bold"
                    >
                      🚀 Apply to Selected Days
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* CLIENT & OPERATIONAL VIEWS - ALLOCATIONS TRACKER LIST */
            <div className={`p-6 rounded-2xl border ${isDark ? "bg-[#161616] border-[#2D2D2D]" : "bg-white border-slate-100"}`}>
              <div className="flex items-center justify-between gap-4 mb-6 border-b pb-4 border-slate-500/10">
                <div className="flex items-center gap-2">
                  <Building2 className="text-blue-500" size={20} />
                  <h2 className="text-lg font-bold">All Active Allocations ({filteredList.length})</h2>
                </div>
              </div>

              {/* Filters console */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                  <input
                    type="text"
                    placeholder="Search employee, PS, project..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg text-xs focus:outline-none ${isDark ? "bg-[#1c1c1c] border-slate-800 text-white" : "bg-white border-slate-200"}`}
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`py-2 px-3 border rounded-lg text-xs focus:outline-none ${isDark ? "bg-[#1c1c1c] border-slate-800 text-white [background-color:#1c1c1c]" : "bg-white border-slate-200"}`}
                >
                  <option value="all">All Workflow Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Client Approved">Client Approved</option>
                  <option value="LTTS PM Approved">LTTS PM Approved</option>
                  <option value="HR Approved">HR Approved</option>
                  <option value="Payroll Ready">Payroll Consolidated</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Correction Requested">Correction Requested</option>
                </select>

                <select
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  className={`py-2 px-3 border rounded-lg text-xs focus:outline-none ${isDark ? "bg-[#1c1c1c] border-slate-800 text-white [background-color:#1c1c1c]" : "bg-white border-slate-200"}`}
                >
                  <option value="all">All Clients</option>
                  {AVAILABLE_CLIENTS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Table list */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`text-slate-400 font-bold border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Allocated Client</th>
                      <th className="py-3 px-4">Allocated Date</th>
                      <th className="py-3 px-4 text-center">Regular Hours</th>
                      <th className="py-3 px-4 text-center">OT Hours</th>
                      <th className="py-3 px-4 text-center">Workflow Status</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? "divide-slate-800/60" : "divide-slate-100"}`}>
                    {filteredList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-500">
                          No allocated timesheets matches current filter scope.
                        </td>
                      </tr>
                    ) : (
                      filteredList.map((ts) => (
                        <tr
                          key={ts.id}
                          onClick={() => setSelectedTimesheet(ts)}
                          className={`hover:bg-slate-500/5 cursor-pointer transition ${selectedTimesheet?.id === ts.id ? (isDark ? "bg-slate-500/10" : "bg-blue-500/5") : ""}`}
                        >
                          <td className="py-3.5 px-4 font-semibold">
                            <div className="text-sm font-bold text-white">{ts.employeeName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{ts.employeeId}</div>
                          </td>
                          <td className="py-3.5 px-4 font-medium">
                            <div className={`${isDark ? "text-slate-300" : "text-slate-700"}`}>{ts.client}</div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{ts.project}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">{ts.date}</td>
                          <td className="py-3.5 px-4 text-center font-bold text-sm">{ts.regularHours}h</td>
                          <td className={`py-3.5 px-4 text-center font-bold text-sm ${ts.overtimeHours > 0 ? "text-rose-500" : "text-slate-500"}`}>{ts.overtimeHours}h</td>
                          <td className="py-3.5 px-4 text-center">{getStatusBadge(ts.status)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Right 1 Column: Multi-stage Workflow Progress & Detail Panel */}
        <div className="lg:col-span-1">
          <div className={`p-6 rounded-2xl border h-full flex flex-col justify-between ${isDark ? "bg-[#161616] border-[#2D2D2D]" : "bg-white border-slate-100"}`}>
            
            <div>
              <div className="flex items-center gap-2 mb-6 border-b pb-4 border-slate-500/10">
                <History className="text-blue-500" size={20} />
                <h2 className="text-lg font-bold">Workflow Timeline</h2>
              </div>

              {selectedTimesheet ? (
                /* Timesheet is selected: show vertical pipeline audit log & action controls */
                <div className="space-y-6">
                  <div>
                    <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{selectedTimesheet.employeeName}</h3>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">{selectedTimesheet.employeeId} | Allocated Date: {selectedTimesheet.date}</p>
                    
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-slate-500/5 border border-slate-500/5">
                      <div>
                        <span className="text-slate-500">Client Sponsor</span>
                        <div className="font-semibold text-slate-300 mt-0.5">{selectedTimesheet.client}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Project Code</span>
                        <div className="font-semibold text-slate-300 mt-0.5 truncate">{selectedTimesheet.project}</div>
                      </div>
                      <div className="mt-2">
                        <span className="text-slate-500">Regular Work</span>
                        <div className="font-semibold text-slate-300 mt-0.5">{selectedTimesheet.regularHours} hours</div>
                      </div>
                      <div className="mt-2">
                        <span className="text-slate-500">Approved OT</span>
                        <div className={`font-semibold mt-0.5 ${selectedTimesheet.overtimeHours > 0 ? "text-rose-500" : "text-slate-300"}`}>{selectedTimesheet.overtimeHours} hours</div>
                      </div>
                    </div>
                  </div>

                  {/* Vertical Timeline Pipeline */}
                  <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Approval Pipeline</span>
                    <div className="relative border-l border-slate-800 ml-2.5 pl-5 space-y-5">
                      
                      {selectedTimesheet.workflowLogs.map((log, lIdx) => (
                        <div key={lIdx} className="relative">
                          {/* Colored dot on vertical timeline */}
                          <div className={`absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full ring-4 ${isDark ? "ring-[#161616]" : "ring-white"} ${getStatusColorCircle(log.stage)}`} />
                          
                          <div className="text-xs">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-slate-300">{log.stage}</span>
                              <span className="text-[9px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{log.user} ({log.role})</div>
                            {log.comments && (
                              <div className="text-[10px] text-slate-500 italic mt-1 bg-slate-500/5 p-1.5 rounded">
                                "{log.comments}"
                              </div>
                            )}
                            {log.duration && (
                              <div className="flex items-center gap-1.5 text-[9px] text-slate-500 mt-1">
                                <Clock size={10} /> SLA: <strong className={log.slaStatus === "SLA Breached" ? "text-rose-500" : "text-emerald-400"}>{log.duration} ({log.slaStatus})</strong>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                    </div>
                  </div>

                  {/* Inline Action Form depending on perspective and status */}
                  <div className="border-t border-slate-500/10 pt-4 mt-6">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Advance Pipeline Status</span>
                    
                    {/* Action form field */}
                    <input
                      type="text"
                      placeholder="Enter workflow action remarks..."
                      value={workflowComment}
                      onChange={(e) => setWorkflowComment(e.target.value)}
                      className={`w-full py-1.5 px-3 border rounded-lg text-xs focus:outline-none mb-3 ${isDark ? "bg-[#1c1c1c] border-slate-800 text-white" : "bg-white border-slate-200"}`}
                    />

                    {/* Employee Actions */}
                    {activeRole === "employee" && selectedTimesheet.status === "Draft" && (
                      <button
                        onClick={() => handleWorkflowAction(selectedTimesheet.id, "Submitted")}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <Send size={12} /> Submit to Sponsoring Client
                      </button>
                    )}

                    {/* Client Sponsor Actions */}
                    {activeRole === "client" && selectedTimesheet.status === "Submitted" && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleWorkflowAction(selectedTimesheet.id, "Correction Requested")}
                          className="py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition"
                        >
                          ⚠️ Request Correction
                        </button>
                        <button
                          onClick={() => handleWorkflowAction(selectedTimesheet.id, "Client Approved")}
                          className="py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition"
                        >
                          ✅ Client Approve
                        </button>
                      </div>
                    )}

                    {/* Operations Actions */}
                    {activeRole === "operations" && (
                      <div>
                        {currentOpSpecialist.role === "LTTS Project Manager" && selectedTimesheet.status === "Client Approved" && (
                          <button
                            onClick={() => handleWorkflowAction(selectedTimesheet.id, "LTTS PM Approved")}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition"
                          >
                            🛡️ Project Manager Sign-off
                          </button>
                        )}
                        {currentOpSpecialist.role === "HR" && selectedTimesheet.status === "LTTS PM Approved" && (
                          <button
                            onClick={() => handleWorkflowAction(selectedTimesheet.id, "HR Approved")}
                            className="w-full py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-bold transition"
                          >
                            🛡️ HR Compliance Release
                          </button>
                        )}
                        {currentOpSpecialist.role === "Super Admin" && selectedTimesheet.status === "HR Approved" && (
                          <button
                            onClick={() => handleWorkflowAction(selectedTimesheet.id, "Payroll Ready")}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                          >
                            🚀 Consolidate to Active Payroll
                          </button>
                        )}
                      </div>
                    )}

                    {/* Fallback info when no actions are available */}
                    {((activeRole === "employee" && selectedTimesheet.status !== "Draft") ||
                      (activeRole === "client" && selectedTimesheet.status !== "Submitted") ||
                      (activeRole === "operations" && 
                       !(
                         (currentOpSpecialist.role === "LTTS Project Manager" && selectedTimesheet.status === "Client Approved") ||
                         (currentOpSpecialist.role === "HR" && selectedTimesheet.status === "LTTS PM Approved") ||
                         (currentOpSpecialist.role === "Super Admin" && selectedTimesheet.status === "HR Approved")
                       )
                      )
                     ) && (
                      <div className="text-center py-2 px-3 border border-dashed border-slate-800 rounded bg-slate-500/5 text-[10px] text-slate-500 font-semibold">
                        Awaiting next party action in the pipeline.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* No timesheet is selected: show helpful instructions */
                <div className="flex flex-col items-center justify-center text-center py-20 text-slate-500">
                  <div className="p-4 bg-slate-500/5 rounded-full border border-dashed border-slate-500/10 mb-4">
                    <FileText size={24} className="text-slate-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-400">No Allocation Selected</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                    {activeRole === "employee" 
                      ? "Click on any day on the allocations calendar to view or edit specific records."
                      : "Click on any timesheet record in the list view to track pipeline duration, audit logs, and trigger status updates."}
                  </p>
                </div>
              )}
            </div>

            {/* Simulated Live status widget */}
            {selectedTimesheet && selectedTimesheet.status === "Payroll Ready" && (
              <div className="mt-6 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-3">
                <ShieldCheck className="text-emerald-400 shrink-0" size={20} />
                <div className="text-xs">
                  <strong className="text-emerald-400 block font-bold">Synchronized to Ledger</strong>
                  <span className="text-[10px] text-slate-400 mt-0.5">This client timesheet has been approved and automatically reconciled into the main payroll validation and reconciliations dashboard.</span>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* MODAL FORM DIALOG FOR INDIVIDUAL TIMESHEET ENTRY */}
      {openModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" id="add-timesheet-dialog">
          <div className="flex items-center justify-center min-h-screen p-4 text-center">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity" onClick={() => setOpenModal(false)}></div>

            <div className={`relative rounded-2xl max-w-lg w-full p-6 text-left shadow-2xl transform transition-all border ${isDark ? "bg-[#181818] border-slate-800" : "bg-white border-slate-100"}`}>
              <div className="flex justify-between items-center pb-4 border-b border-slate-500/10">
                <h3 className="text-lg font-bold">{editingTimesheet ? "Modify Allocated Allocation" : "Submit Allocated Allocation"}</h3>
                <button onClick={() => setOpenModal(false)} className="text-slate-400 hover:text-white transition cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateOrUpdate} className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">PS Number</label>
                    <input
                      type="text"
                      disabled
                      value={formValues.employeeId}
                      className={`w-full py-2 px-3 border rounded-lg text-xs focus:outline-none opacity-65 ${isDark ? "bg-[#111111] border-slate-800 text-slate-400" : "bg-slate-100 border-slate-200"}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Employee Name</label>
                    <input
                      type="text"
                      disabled
                      value={formValues.employeeName}
                      className={`w-full py-2 px-3 border rounded-lg text-xs focus:outline-none opacity-65 ${isDark ? "bg-[#111111] border-slate-800 text-slate-400" : "bg-slate-100 border-slate-200"}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Allocated Date</label>
                    <input
                      type="date"
                      value={formValues.date}
                      onChange={(e) => setFormValues({ ...formValues, date: e.target.value })}
                      className={`w-full py-2 px-3 border rounded-lg text-xs focus:outline-none ${isDark ? "bg-[#1c1c1c] border-slate-800 text-white" : "bg-white border-slate-200"}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Sponsoring Client</label>
                    <select
                      value={formValues.client}
                      onChange={(e) => setFormValues({ ...formValues, client: e.target.value })}
                      className={`w-full py-2 px-3 border rounded-lg text-xs focus:outline-none ${isDark ? "bg-[#1c1c1c] border-slate-800 text-white [background-color:#1c1c1c]" : "bg-white border-slate-200"}`}
                    >
                      {AVAILABLE_CLIENTS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Regular Hours</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="12"
                      value={formValues.regularHours}
                      onChange={(e) => setFormValues({ ...formValues, regularHours: Number(e.target.value) })}
                      className={`w-full py-2 px-3 border rounded-lg text-xs focus:outline-none ${isDark ? "bg-[#1c1c1c] border-slate-800 text-white" : "bg-white border-slate-200"}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Overtime Hours</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="12"
                      value={formValues.overtimeHours}
                      onChange={(e) => setFormValues({ ...formValues, overtimeHours: Number(e.target.value) })}
                      className={`w-full py-2 px-3 border rounded-lg text-xs focus:outline-none ${isDark ? "bg-[#1c1c1c] border-slate-800 text-white" : "bg-white border-slate-200"}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Work Shift</label>
                    <select
                      value={formValues.shift}
                      onChange={(e) => setFormValues({ ...formValues, shift: e.target.value })}
                      className={`w-full py-2 px-3 border rounded-lg text-xs focus:outline-none ${isDark ? "bg-[#1c1c1c] border-slate-800 text-white [background-color:#1c1c1c]" : "bg-white border-slate-200"}`}
                    >
                      <option value="General">General</option>
                      <option value="Morning">Morning</option>
                      <option value="Afternoon">Afternoon</option>
                      <option value="Night">Night</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Location</label>
                    <select
                      value={formValues.location}
                      onChange={(e) => setFormValues({ ...formValues, location: e.target.value })}
                      className={`w-full py-2 px-3 border rounded-lg text-xs focus:outline-none ${isDark ? "bg-[#1c1c1c] border-slate-800 text-white [background-color:#1c1c1c]" : "bg-white border-slate-200"}`}
                    >
                      <option value="Onsite">Onsite</option>
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Project Code / Code Name</label>
                  <input
                    type="text"
                    required
                    value={formValues.project}
                    onChange={(e) => setFormValues({ ...formValues, project: e.target.value })}
                    className={`w-full py-2 px-3 border rounded-lg text-xs focus:outline-none ${isDark ? "bg-[#1c1c1c] border-slate-800 text-white" : "bg-white border-slate-200"}`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Comments / Activity Description</label>
                  <textarea
                    rows={2}
                    value={formValues.comments}
                    onChange={(e) => setFormValues({ ...formValues, comments: e.target.value })}
                    className={`w-full py-2 px-3 border rounded-lg text-xs focus:outline-none ${isDark ? "bg-[#1c1c1c] border-slate-800 text-white" : "bg-white border-slate-200"}`}
                    placeholder="Enter activity summaries..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-500/10">
                  <button
                    type="button"
                    onClick={() => setOpenModal(false)}
                    className={`px-4 py-2 border rounded-lg text-xs font-semibold ${isDark ? "border-[#2D2D2D] text-slate-300" : "border-slate-200 text-slate-600"}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                  >
                    {editingTimesheet ? "Save Changes" : "Save Draft"}
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
