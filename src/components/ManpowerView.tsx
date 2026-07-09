import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Box,
  Typography,
  IconButton
} from "@mui/material";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Download,
  CheckCircle,
  UserCheck,
  UserMinus,
  Briefcase,
  Globe,
  DollarSign,
  X,
  Plus,
  Undo,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";
import { Employee, UserRole } from "../types";

interface ManpowerViewProps {
  employees: Employee[];
  onSaveEmployee: (emp: Employee) => Promise<void>;
  onDeleteEmployee: (empId: string) => Promise<void>;
  currentRole: UserRole;
  theme: "dark" | "light";
}

export default function ManpowerView({
  employees,
  onSaveEmployee,
  onDeleteEmployee,
  currentRole,
  theme
}: ManpowerViewProps) {
  const isDark = theme === "dark";

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Edit / Add modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editEmpId, setEditEmpId] = useState("");

  // Form fields
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formCountry, setFormCountry] = useState("India");
  const [formDept, setFormDept] = useState("Engineering");
  const [formTitle, setFormTitle] = useState("");
  const [formSalary, setFormSalary] = useState(120000);
  const [formStatus, setFormStatus] = useState("Active");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (modalMode === "add") {
      const emailSuggest = val.trim().replace(/\s+/g, '.').toLowerCase();
      setFormEmail(emailSuggest ? `${emailSuggest}@nexus-corp.com` : "");
    }
  };

  // Get flag representation
  const getFlag = (countryName: string) => {
    switch (countryName) {
      case "Singapore": return "🇸🇬";
      case "Germany": return "🇩🇪";
      case "United States": return "🇺🇸";
      case "Japan": return "🇯🇵";
      case "France": return "🇫🇷";
      case "India": return "🇮🇳";
      default: return "🌐";
    }
  };

  const getCurrencySymbol = (countryName: string) => {
    switch (countryName) {
      case "Singapore": return "S$";
      case "Germany": return "€";
      case "United States": return "$";
      case "Japan": return "¥";
      case "France": return "€";
      case "India": return "₹";
      default: return "$";
    }
  };

  // KPI Calculations
  const activeEmployees = employees.filter(e => e.status === "Active");
  const totalPayrollCost = activeEmployees.reduce((sum, e) => sum + e.salary, 0);
  const avgSalary = activeEmployees.length > 0 ? Math.round(totalPayrollCost / activeEmployees.length) : 0;

  // Find top talent country
  const countryCounts = activeEmployees.reduce((acc, e) => {
    acc[e.country] = (acc[e.country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  let topCountry = "N/A";
  let maxCount = 0;
  Object.entries(countryCounts).forEach(([c, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topCountry = c;
    }
  });

  // Filtered employees
  const filteredEmployees = employees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = selectedCountry === "All" || e.country === selectedCountry;
    const matchesDept = selectedDept === "All" || e.department === selectedDept;
    const matchesStatus = selectedStatus === "All" || e.status === selectedStatus;

    return matchesSearch && matchesCountry && matchesDept && matchesStatus;
  });

  // Handle open add modal
  const openAddModal = () => {
    setModalMode("add");
    // Generate randomized incremental ID or let user type
    const nextNum = employees.length > 0
      ? Math.max(...employees.map(e => parseInt(e.id.replace(/\D/g, "")) || 0)) + 1
      : 1001;
    setEditEmpId(`EMP-${nextNum}`);
    setFormName("");
    setFormEmail("");
    setFormCountry("Singapore");
    setFormDept("Engineering");
    setFormTitle("");
    setFormSalary(6000);
    setFormStatus("Active");
    setFormError("");
    setIsModalOpen(true);
  };

  // Handle open edit modal
  const openEditModal = (emp: Employee & { email?: string }) => {
    setModalMode("edit");
    setEditEmpId(emp.id);
    setFormName(emp.name);
    setFormEmail(emp.email || `${emp.name.replace(/\s+/g, '.').toLowerCase()}@nexus-corp.com`);
    setFormCountry(emp.country);
    setFormDept(emp.department);
    setFormTitle(emp.title);
    setFormSalary(emp.salary);
    setFormStatus(emp.status);
    setFormError("");
    setIsModalOpen(true);
  };

  // Form submit handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Employee name is required.");
      return;
    }
    if (!formEmail.trim() || !formEmail.includes("@")) {
      setFormError("A valid company email is required.");
      return;
    }
    if (!formTitle.trim()) {
      setFormError("Job title is required.");
      return;
    }
    if (formSalary <= 0) {
      setFormError("Monthly salary must be a positive number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const empPayload: Employee & { email?: string } = {
        id: editEmpId,
        name: formName.trim(),
        email: formEmail.trim(),
        country: formCountry,
        department: formDept,
        title: formTitle.trim(),
        salary: Number(formSalary),
        status: formStatus
      };
      await onSaveEmployee(empPayload as any);
      setIsModalOpen(false);
    } catch (err) {
      setFormError("Failed to update Firestore employee roster. Please check cloud connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete click
  const handleDeleteClick = async (empId: string, empName: string) => {
    if (!confirm(`Are you sure you want to permanently delete employee ${empName} (${empId})? This will wipe their profile and compliance tracking from Firestore.`)) return;
    try {
      await onDeleteEmployee(empId);
    } catch (e) {
      alert("Failed to delete employee from database.");
    }
  };

  // Ingest synthetic expansion pack
  const handleLoadSyntheticPack = async () => {
    const syntheticPack: Employee[] = [
      { id: "EMP-4150", name: "Amit Sharma", country: "India", department: "Engineering", title: "Senior DevOps Engineer", salary: 145000, status: "Active" },
      { id: "EMP-4151", name: "Sneha Patel", country: "India", department: "Product", title: "Lead UX Researcher", salary: 135000, status: "Active" },
      { id: "EMP-4152", name: "Rohan Das", country: "India", department: "Sales", title: "Account Executive", salary: 95000, status: "Active" },
      { id: "EMP-4153", name: "Ananya Joshi", country: "India", department: "Operations", title: "Local Coordinator", salary: 85000, status: "Active" },
      { id: "EMP-4154", name: "Karan Gupta", country: "India", department: "Marketing", title: "Content strategist", salary: 110000, status: "Active" },
      { id: "EMP-4155", name: "Siddharth Nair", country: "India", department: "Finance", title: "Corporate Controller", salary: 165000, status: "Active" },
      { id: "EMP-4156", name: "Sai Gupta", country: "India", department: "Engineering", title: "Media Architect", salary: 158000, status: "Active" },
      { id: "EMP-4157", name: "Amit Gupta", country: "India", department: "Engineering", title: "QA Engineer", salary: 120000, status: "Inactive" },
      { id: "EMP-4158", name: "Priya Patel", country: "India", department: "Engineering", title: "Distinguished Fellow", salary: 225000, status: "Active" },
      { id: "EMP-4159", name: "Karan Patel", country: "India", department: "Operations", title: "Facility Supervisor", salary: 85000, status: "Active" }
    ];

    if (!confirm("Would you like to auto-hydrate the directory with 10 high-density synthetic corporate profiles? This triggers Firestore background batch writes.")) return;

    let count = 0;
    for (const emp of syntheticPack) {
      if (!employees.some(e => e.id === emp.id)) {
        await onSaveEmployee(emp);
        count++;
      }
    }
    alert(`✓ Successfully imported ${count} fresh synthetic profiles directly to Cloud Firestore! Directory stats have refreshed.`);
  };

  // Export Roster Roster
  const handleExportRoster = () => {
    const header = "Employee ID,Name,Country,Department,Title,Monthly Salary,Status\n";
    const rows = filteredEmployees.map(e =>
      `"${e.id}","${e.name}","${e.country}","${e.department}","${e.title}",${e.salary},"${e.status}"`
    ).join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(header + rows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `nexus_manpower_roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4" id="manpower_view_container">
      {/* View Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Users size={16} className="text-[#0078D4]" />
            NEXUS Global Manpower Directory
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Administer global employee records, aggregate payroll commitments, and manage statutory parameters across 5 continent hubs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={handleLoadSyntheticPack}
            className={`px-2.5 py-1.5 rounded text-[11px] font-bold border flex items-center gap-1.5 transition ${isDark
                ? "bg-[#2D2D2D] hover:bg-[#3D3D3D] border-[#3D3D3D] text-slate-200"
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm"
              }`}
          >
            <Plus size={11} className="text-emerald-500" />
            Bulk Hydrate (+10 Records)
          </button>
          <button
            onClick={handleExportRoster}
            className={`px-2.5 py-1.5 rounded text-[11px] font-bold border flex items-center gap-1.5 transition ${isDark
                ? "bg-[#2D2D2D] hover:bg-[#3D3D3D] border-[#3D3D3D] text-slate-200"
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm"
              }`}
          >
            <Download size={11} className="text-indigo-500" />
            Export CSV
          </button>
          <button
            onClick={openAddModal}
            className="px-3 py-1.5 rounded bg-[#0078D4] hover:bg-[#005A9E] text-white text-[11px] font-bold flex items-center gap-1.5 shadow transition"
          >
            <UserPlus size={12} />
            Add Employee Record
          </button>
        </div>
      </div>

      {/* Aggregate KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5" id="manpower_kpis">
        {/* Headcount */}
        <div className={`p-3.5 rounded-md border flex flex-col justify-between h-[95px] ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"
          }`}>
          <span className="text-[10.5px] font-bold text-slate-400 flex items-center gap-1.5">
            <Users size={12} className="text-[#0078D4]" />
            Active Headcount
          </span>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-2xl font-black text-[#0078D4]">{activeEmployees.length}</span>
            <span className="text-[9px] text-slate-400">/ {employees.length} Total</span>
          </div>
          <span className="text-[9px] text-slate-400">Enrolled in active corporate rosters</span>
        </div>

        {/* Total Payroll */}
        <div className={`p-3.5 rounded-md border flex flex-col justify-between h-[95px] ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"
          }`}>
          <span className="text-[10.5px] font-bold text-slate-400 flex items-center gap-1.5">
            <DollarSign size={12} className="text-emerald-500" />
            Total Base Salaries
          </span>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-xl font-black text-emerald-500">
              ${totalPayrollCost.toLocaleString()}.00
            </span>
            <span className="text-[9px] text-slate-400 font-mono">USD/mo</span>
          </div>
          <span className="text-[9px] text-slate-400">Sum of active employee base rates</span>
        </div>

        {/* Avg Salary */}
        <div className={`p-3.5 rounded-md border flex flex-col justify-between h-[95px] ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"
          }`}>
          <span className="text-[10.5px] font-bold text-slate-400 flex items-center gap-1.5">
            <Briefcase size={12} className="text-amber-500" />
            Average Monthly Rate
          </span>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-xl font-black text-amber-500">
              ${avgSalary.toLocaleString()}.00
            </span>
          </div>
          <span className="text-[9px] text-slate-400">Weighted average rate per worker</span>
        </div>

        {/* Hub */}
        <div className={`p-3.5 rounded-md border flex flex-col justify-between h-[95px] ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"
          }`}>
          <span className="text-[10.5px] font-bold text-slate-400 flex items-center gap-1.5">
            <Globe size={12} className="text-indigo-500" />
            Primary Talent Hub
          </span>
          <div className="flex items-center gap-2 my-1">
            <span className="text-lg">{getFlag(topCountry)}</span>
            <span className="text-base font-bold text-[#323130] dark:text-slate-100">{topCountry}</span>
          </div>
          <span className="text-[9px] text-slate-400">{maxCount} active professionals registered</span>
        </div>
      </div>

      {/* Filter panel & Search Bar */}
      <div className={`p-3 rounded-md border space-y-2.5 ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"
        }`} id="filter_directory_panel">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* Search bar */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-2.5 top-2 text-slate-400" size={13} />
            <input
              type="text"
              placeholder="Search by ID, name, or job title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full text-xs pl-8 pr-2.5 py-1.5 rounded border outline-none font-medium focus:border-[#0078D4] ${isDark ? "bg-[#161616] border-[#2D2D2D] text-white" : "bg-white border-slate-200 text-slate-800"
                }`}
            />
          </div>

          {/* Country filter */}
          <div className="md:col-span-3 flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">Hub:</span>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className={`w-full text-xs p-1.5 rounded border outline-none font-semibold cursor-pointer ${isDark ? "bg-[#161616] border-[#2D2D2D] text-white" : "bg-white border-slate-200 text-slate-800"
                }`}
            >
              <option value="All">All Countries</option>
              <option value="India">India</option>
            </select>
          </div>

          {/* Dept filter */}
          <div className="md:col-span-3 flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">Dept:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className={`w-full text-xs p-1.5 rounded border outline-none font-semibold cursor-pointer ${isDark ? "bg-[#161616] border-[#2D2D2D] text-white" : "bg-white border-slate-200 text-slate-800"
                }`}
            >
              <option value="All">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Product">Product</option>
              <option value="Sales">Sales</option>
              <option value="Operations">Operations</option>
              <option value="Marketing">Marketing</option>
              <option value="Finance">Finance</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="md:col-span-2 flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`w-full text-xs p-1.5 rounded border outline-none font-semibold cursor-pointer ${isDark ? "bg-[#161616] border-[#2D2D2D] text-white" : "bg-white border-slate-200 text-slate-800"
                }`}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Roster Data Table */}
      <div className={`border rounded-md overflow-hidden ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"
        }`} id="roster_table_card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b text-[10.5px] uppercase font-bold tracking-wider ${isDark ? "bg-[#161616]/40 border-[#2D2D2D] text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
                }`}>
                <th className="py-2 px-3 font-bold">Employee ID</th>
                <th className="py-2 px-3 font-bold">Full Name</th>
                <th className="py-2 px-3 font-bold">Country Hub</th>
                <th className="py-2 px-3 font-bold">Department</th>
                <th className="py-2 px-3 font-bold">Corporate Job Title</th>
                <th className="py-2 px-3 font-bold">Monthly Base Rate</th>
                <th className="py-2 px-3 font-bold">Payroll Status</th>
                <th className="py-2 px-3 text-right font-bold">Action Control</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <AlertCircle size={20} className="text-slate-500 opacity-60" />
                      <span className="font-semibold text-xs">No employee records match the search query.</span>
                      <span className="text-[10px]">Try resetting filters or seeding dynamic profiles.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    id={`roster_row_${emp.id}`}
                    className={`border-b last:border-b-0 transition-colors ${isDark ? "border-[#2D2D2D]/50 hover:bg-[#2D2D2D]/30" : "border-slate-100 hover:bg-slate-50/50"
                      }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-400 text-[11px]">{emp.id}</td>
                    <td className="py-2.5 px-3 font-bold text-[#323130] dark:text-white">{emp.name}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                        <span>{getFlag(emp.country)}</span>
                        <span>{emp.country}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-medium">{emp.department}</td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{emp.title}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-emerald-400">
                      {getCurrencySymbol(emp.country)} {emp.salary.toLocaleString()}.00
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center w-fit gap-1 ${emp.status === "Active"
                          ? "bg-[#107C10]/10 text-[#107C10]"
                          : "bg-rose-500/10 text-rose-500"
                        }`}>
                        <span className={`w-1 h-1 rounded-full ${emp.status === "Active" ? "bg-[#107C10]" : "bg-rose-500"}`} />
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(emp)}
                          className="p-1 hover:bg-[#0078D4]/10 hover:text-[#0078D4] text-slate-400 rounded transition"
                          title="Edit Employee Roster"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(emp.id, emp.name)}
                          className="p-1 hover:bg-rose-500/10 hover:text-rose-500 text-slate-400 rounded transition"
                          title="Delete Employee Profile"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Form Dialog Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="sm"
        fullWidth
        id="add_employee_dialog"
        sx={{
          "& .MuiDialog-paper": {
            bgcolor: isDark ? "#1F1F1F" : "#ffffff",
            color: isDark ? "#ffffff" : "#323130",
            border: `1px solid ${isDark ? "#2D2D2D" : "#EDEBE9"}`,
            borderRadius: "6px",
            boxShadow: 24,
          }
        }}
      >
        <form onSubmit={handleFormSubmit}>
          <DialogTitle sx={{ borderBottom: `1px solid ${isDark ? "#2D2D2D" : "#EDEBE9"}`, px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 800 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Users size={18} style={{ color: "#0078D4" }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "12px", color: isDark ? "#94A3B8" : "#475569" }}>
                {modalMode === "add" ? "Register Employee Profile" : `Edit Profile: ${editEmpId}`}
              </Typography>
            </Box>
            <IconButton onClick={() => setIsModalOpen(false)} size="small" sx={{ color: isDark ? "#94A3B8" : "#475569" }}>
              <X size={16} />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ px: 3, pt: "24px !important", pb: 3, display: "flex", flexDirection: "column", gap: 2.5, maxHeight: "70vh", overflowY: "auto" }}>
            {formError && (
              <Box sx={{ p: 1.5, bgcolor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#EF4444", fontSize: "11px", borderRadius: "4px", display: "flex", alignItems: "center", gap: 1, fontWeight: "bold" }}>
                <AlertCircle size={14} />
                {formError}
              </Box>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <TextField
                  fullWidth
                  size="small"
                  label="Employee ID (PS Number)"
                  value={editEmpId}
                  disabled={modalMode === "edit"}
                  onChange={(e) => setEditEmpId(e.target.value)}
                  required
                  slotProps={{
                    input: {
                      style: { fontFamily: "monospace", fontWeight: "bold" }
                    }
                  }}
                />
              </div>

              <div>
                <TextField
                  fullWidth
                  size="small"
                  label="Employee Full Name"
                  placeholder="e.g. Ronak Surve"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <TextField
                  fullWidth
                  size="small"
                  label="Company Email"
                  placeholder="e.g. name@nexus-corp.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                  type="email"
                />
              </div>

              <div>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Country Hub</InputLabel>
                  <Select
                    value={formCountry}
                    label="Country Hub"
                    onChange={(e) => setFormCountry(e.target.value as string)}
                    sx={{ fontWeight: "bold" }}
                  >
                    <MenuItem value="India">India 🇮🇳</MenuItem>
                    <MenuItem value="Singapore">Singapore 🇸🇬</MenuItem>
                    <MenuItem value="United States">United States 🇺🇸</MenuItem>
                    <MenuItem value="United Kingdom">United Kingdom 🇬🇧</MenuItem>
                    <MenuItem value="Canada">Canada 🇨🇦</MenuItem>
                    <MenuItem value="Australia">Australia 🇦🇺</MenuItem>
                    <MenuItem value="Japan">Japan 🇯🇵</MenuItem>
                    <MenuItem value="Germany">Germany 🇩🇪</MenuItem>
                    <MenuItem value="United Arab Emirates">United Arab Emirates 🇦🇪</MenuItem>
                  </Select>
                </FormControl>
              </div>

              <div>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={formDept}
                    label="Department"
                    onChange={(e) => setFormDept(e.target.value as string)}
                    sx={{ fontWeight: "bold" }}
                  >
                    <MenuItem value="Engineering">Engineering</MenuItem>
                    <MenuItem value="Product">Product</MenuItem>
                    <MenuItem value="Sales">Sales</MenuItem>
                    <MenuItem value="Operations">Operations</MenuItem>
                    <MenuItem value="Marketing">Marketing</MenuItem>
                    <MenuItem value="Finance">Finance</MenuItem>
                  </Select>
                </FormControl>
              </div>

              <div>
                <TextField
                  fullWidth
                  size="small"
                  label="Corporate Job Title"
                  placeholder="e.g. Lead Software Engineer"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Payroll Status</InputLabel>
                  <Select
                    value={formStatus}
                    label="Payroll Status"
                    onChange={(e) => setFormStatus(e.target.value as string)}
                    sx={{ fontWeight: "bold" }}
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </div>

              <div className="sm:col-span-2">
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Monthly Base Rate"
                  placeholder="e.g. 6000"
                  value={formSalary}
                  onChange={(e) => setFormSalary(Number(e.target.value))}
                  required
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <span style={{ fontFamily: "monospace", fontWeight: "bold", fontSize: "12px" }}>
                            {getCurrencySymbol(formCountry)}
                          </span>
                        </InputAdornment>
                      ),
                      style: { fontFamily: "monospace", fontWeight: "bold" }
                    }
                  }}
                />
              </div>
            </div>
          </DialogContent>

          <DialogActions sx={{ borderTop: `1px solid ${isDark ? "#2D2D2D" : "#EDEBE9"}`, px: 3, py: 2 }}>
            <Button
              onClick={() => setIsModalOpen(false)}
              sx={{ textTransform: "none", fontWeight: 700, color: isDark ? "#94A3B8" : "#475569" }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                bgcolor: "#0078D4",
                "&:hover": { bgcolor: "#005A9E" }
              }}
            >
              {isSubmitting ? "Saving..." : "Commit Changes"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}
