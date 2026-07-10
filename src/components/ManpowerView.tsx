import React, { useState } from "react";
import * as XLSX from "xlsx";
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
  onBulkSaveEmployees: (emps: Employee[]) => Promise<void>;
  onResetEmployees: () => Promise<void>;
  currentRole: UserRole;
  theme: "dark" | "light";
}

export default function ManpowerView({
  employees,
  onSaveEmployee,
  onDeleteEmployee,
  onBulkSaveEmployees,
  onResetEmployees,
  currentRole,
  theme
}: ManpowerViewProps) {
  const isDark = theme === "dark";

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Non-blocking iframe-safe dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [alertDialog, setAlertDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    severity: "success" | "error" | "info";
  }>({
    open: false,
    title: "",
    message: "",
    severity: "info",
  });

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      open: true,
      title,
      message,
      onConfirm,
    });
  };

  const triggerAlert = (title: string, message: string, severity: "success" | "error" | "info" = "info") => {
    setAlertDialog({
      open: true,
      title,
      message,
      severity,
    });
  };

  // Bulk Upload states
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [parsedEmployees, setParsedEmployees] = useState<Employee[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileProcess = (file: File) => {
    setUploadError(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        if (rawRows.length === 0) {
          setUploadError("The uploaded file appears to be completely empty.");
          return;
        }

        const firstRow = rawRows[0];
        if (!firstRow || !Array.isArray(firstRow)) {
          setUploadError("Failed to read headers from the spreadsheet. Check structure.");
          return;
        }

        const headers = firstRow.map(h => String(h || "").trim().toLowerCase());
        
        // Find column indices based on fuzzy headers
        const idIdx = headers.findIndex(h => h === "id" || h.includes("employee id") || h.includes("empid") || h.includes("employee_id") || h.includes("code"));
        const nameIdx = headers.findIndex(h => h === "name" || h.includes("employee name") || h.includes("full name") || h.includes("empname") || h === "fullname");
        const countryIdx = headers.findIndex(h => h === "country" || h.includes("region") || h.includes("location") || h.includes("hub") || h.includes("nation"));
        const deptIdx = headers.findIndex(h => h === "department" || h.includes("dept") || h.includes("team") || h.includes("division"));
        const titleIdx = headers.findIndex(h => h === "title" || h.includes("role") || h.includes("designation") || h.includes("job title") || h.includes("position"));
        const salaryIdx = headers.findIndex(h => h === "salary" || h.includes("monthly salary") || h.includes("compensation") || h.includes("pay") || h.includes("monthly_salary") || h.includes("rate"));
        const statusIdx = headers.findIndex(h => h === "status" || h.includes("active") || h.includes("employment status"));

        if (nameIdx === -1 && idIdx === -1) {
          setUploadError("Could not identify mandatory columns. Please ensure your file has 'Employee ID' or 'Name' column.");
          return;
        }

        const emps: Employee[] = [];
        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || !Array.isArray(row) || row.filter(cell => cell !== undefined && cell !== null && cell !== "").length === 0) {
            continue; // Skip empty rows
          }

          let empId = idIdx !== -1 && row[idIdx] ? String(row[idIdx]).trim() : `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
          let empName = nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]).trim() : "Unknown Employee";
          let empCountry = countryIdx !== -1 && row[countryIdx] ? String(row[countryIdx]).trim() : "India";
          let empDept = deptIdx !== -1 && row[deptIdx] ? String(row[deptIdx]).trim() : "Engineering";
          let empTitle = titleIdx !== -1 && row[titleIdx] ? String(row[titleIdx]).trim() : "Staff Associate";
          
          let empSalary = 50000;
          if (salaryIdx !== -1 && row[salaryIdx] !== undefined && row[salaryIdx] !== null) {
            const parsedSalary = parseFloat(String(row[salaryIdx]).replace(/[^0-9.]/g, ""));
            if (!isNaN(parsedSalary)) {
              empSalary = parsedSalary;
            }
          }
          
          let empStatus = statusIdx !== -1 && row[statusIdx] ? String(row[statusIdx]).trim() : "Active";
          if (empStatus.toLowerCase().includes("active") && !empStatus.toLowerCase().includes("inactive")) {
            empStatus = "Active";
          } else if (empStatus.toLowerCase().includes("inactive") || empStatus.toLowerCase().includes("terminated")) {
            empStatus = "Inactive";
          } else {
            empStatus = "Active";
          }

          emps.push({
            id: empId,
            name: empName,
            country: empCountry,
            department: empDept,
            title: empTitle,
            salary: empSalary,
            status: empStatus
          });
        }

        if (emps.length === 0) {
          setUploadError("No valid employee records found in the spreadsheet rows.");
          return;
        }

        setParsedEmployees(emps);
      } catch (err: any) {
        console.error("Error parsing file:", err);
        setUploadError(`Failed to parse spreadsheet: ${err.message || "Unknown format issue"}`);
      }
    };

    reader.onerror = () => {
      setUploadError("Failed to read the file from storage.");
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleBulkUploadConfirm = async () => {
    if (parsedEmployees.length === 0) return;
    try {
      await onBulkSaveEmployees(parsedEmployees);
      triggerAlert(
        "Success",
        `✓ Successfully parsed and imported ${parsedEmployees.length} employee records from "${fileName}" directly to the Database! Directory statistics have refreshed.`,
        "success"
      );
      setIsBulkUploadOpen(false);
      setParsedEmployees([]);
      setFileName(null);
      setUploadError(null);
    } catch (err) {
      triggerAlert("Error", "Failed to save the uploaded employee records to the database.", "error");
    }
  };

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

  // Get flag representation with expanded support & case insensitivity
  const getFlag = (countryName: string) => {
    if (!countryName) return "🌐";
    const cleanName = countryName.trim().toLowerCase();
    switch (cleanName) {
      case "singapore":
      case "sg":
        return "🇸🇬";
      case "germany":
      case "de":
        return "🇩🇪";
      case "united states":
      case "united states of america":
      case "usa":
      case "us":
        return "🇺🇸";
      case "japan":
      case "jp":
        return "🇯🇵";
      case "france":
      case "fr":
        return "🇫🇷";
      case "india":
      case "in":
        return "🇮🇳";
      case "united kingdom":
      case "uk":
      case "gb":
        return "🇬🇧";
      case "canada":
      case "ca":
        return "🇨🇦";
      case "australia":
      case "au":
        return "🇦🇺";
      case "china":
      case "cn":
        return "🇨🇳";
      case "italy":
      case "it":
        return "🇮🇹";
      case "spain":
      case "es":
        return "🇪🇸";
      case "brazil":
      case "br":
        return "🇧🇷";
      case "netherlands":
      case "nl":
        return "🇳🇱";
      case "united arab emirates":
      case "uae":
      case "ae":
        return "🇦🇪";
      default:
        return "🌐";
    }
  };

  const getCurrencySymbol = (countryName: string) => {
    if (!countryName) return "$";
    const cleanName = countryName.trim().toLowerCase();
    switch (cleanName) {
      case "singapore":
      case "sg":
        return "S$";
      case "germany":
      case "de":
      case "france":
      case "fr":
      case "italy":
      case "it":
      case "spain":
      case "es":
      case "netherlands":
      case "nl":
        return "€";
      case "united states":
      case "usa":
      case "us":
      case "canada":
      case "ca":
      case "australia":
      case "au":
        return "$";
      case "japan":
      case "jp":
        return "¥";
      case "india":
      case "in":
        return "₹";
      case "united kingdom":
      case "uk":
      case "gb":
        return "£";
      case "china":
      case "cn":
        return "¥";
      case "brazil":
      case "br":
        return "R$";
      case "united arab emirates":
      case "uae":
      case "ae":
        return "AED";
      default:
        return "$";
    }
  };

  const convertToUSD = (amount: number, country: string) => {
    if (!country) return amount;
    const cleanName = country.trim().toLowerCase();
    switch (cleanName) {
      case "india":
      case "in":
        return amount * 0.012; // 1 INR = 0.012 USD
      case "germany":
      case "de":
      case "france":
      case "fr":
      case "italy":
      case "it":
      case "spain":
      case "es":
      case "netherlands":
      case "nl":
        return amount * 1.09; // 1 EUR = 1.09 USD
      case "singapore":
      case "sg":
        return amount * 0.74; // 1 SGD = 0.74 USD
      case "japan":
      case "jp":
        return amount * 0.0064; // 1 JPY = 0.0064 USD
      case "united arab emirates":
      case "uae":
      case "ae":
        return amount * 0.2723; // 1 AED = 0.2723 USD
      case "united kingdom":
      case "uk":
      case "gb":
        return amount * 1.28; // 1 GBP = 1.28 USD
      case "canada":
      case "ca":
        return amount * 0.73; // 1 CAD = 0.73 USD
      case "australia":
      case "au":
        return amount * 0.67; // 1 AUD = 0.67 USD
      default:
        return amount; // default to 1.0
    }
  };

  // KPI Calculations
  const activeEmployees = employees.filter(e => e.status === "Active");
  
  // Convert local currencies to USD for indicators as requested
  const totalPayrollCostUSD = activeEmployees.reduce((sum, e) => sum + convertToUSD(e.salary, e.country), 0);
  const avgSalaryUSD = activeEmployees.length > 0 ? Math.round(totalPayrollCostUSD / activeEmployees.length) : 0;

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

  // Dynamic available countries list combining baseline and uploaded entries
  const availableCountries = Array.from(
    new Set([
      "India",
      "Germany",
      "Singapore",
      "United States",
      "Japan",
      "France",
      ...employees.map(e => e.country).filter(Boolean)
    ])
  ).sort();

  // Interconnection logic: toggle or select filter on KPI Hub card click
  const handleHubCardClick = () => {
    if (selectedCountry === "All") {
      setSelectedCountry(displayHubCountry);
    } else {
      setSelectedCountry("All");
    }
  };

  let displayHubCountry = "India";
  let displayHubCount = activeEmployees.filter(e => e.country === "India").length;
  if (selectedCountry !== "All") {
    displayHubCountry = selectedCountry;
    displayHubCount = activeEmployees.filter(e => e.country === selectedCountry).length;
  }

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
  const handleDeleteClick = (empId: string, empName: string) => {
    triggerConfirm(
      "Confirm Deletion",
      `Are you sure you want to permanently delete employee ${empName} (${empId})? This will wipe their profile and compliance tracking from Firestore.`,
      async () => {
        try {
          await onDeleteEmployee(empId);
          triggerAlert("Success", "Employee deleted successfully.", "success");
        } catch (e) {
          triggerAlert("Error", "Failed to delete employee from database.", "error");
        }
      }
    );
  };

  // Reset employee directory to a clean dynamic slate
  const handleResetClick = () => {
    triggerConfirm(
      "Confirm Roster Reset",
      "Are you sure you want to reset the employee directory? This will permanently wipe all existing employee records and reset all directory indicators (such as headcount, total base salaries, and average rates) to zero, allowing you to start fresh with custom spreadsheet uploads.",
      async () => {
        try {
          await onResetEmployees();
          triggerAlert("Success", "✓ Employee directory has been successfully wiped. All indicators have been reset to zero!", "success");
        } catch (e) {
          triggerAlert("Error", "Failed to reset employee directory.", "error");
        }
      }
    );
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
            onClick={handleResetClick}
            className={`px-2.5 py-1.5 rounded text-[11px] font-bold border flex items-center gap-1.5 transition ${isDark
                ? "bg-[#2D2D2D] hover:bg-[#2D2222] border-[#4D2D2D] text-rose-300"
                : "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 shadow-sm"
              }`}
          >
            <Undo size={11} className="text-rose-500" />
            Reset Directory
          </button>
          <button
            onClick={() => setIsBulkUploadOpen(true)}
            className={`px-2.5 py-1.5 rounded text-[11px] font-bold border flex items-center gap-1.5 transition ${isDark
                ? "bg-[#2D2D2D] hover:bg-[#3D3D3D] border-[#3D3D3D] text-slate-200"
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm"
              }`}
          >
            <FileSpreadsheet size={11} className="text-emerald-500" />
            Bulk Hydrate (Excel/CSV)
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
          <span className="text-[9px] text-slate-400 font-medium">Enrolled in active corporate rosters</span>
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
              ${totalPayrollCostUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] text-slate-400 font-mono">USD/mo</span>
          </div>
          <span className="text-[9px] text-slate-400 font-medium">Converted via dynamic FX rates</span>
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
              ${avgSalaryUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] text-slate-400 font-mono">USD/mo</span>
          </div>
          <span className="text-[9px] text-slate-400 font-medium">Weighted average rate per worker</span>
        </div>

        {/* Hub */}
        <div 
          onClick={handleHubCardClick}
          className={`p-3.5 rounded-md border flex flex-col justify-between h-[95px] cursor-pointer transition-all duration-200 select-none ${
            isDark 
              ? "bg-[#1F1F1F] hover:bg-[#2A2A2A] border-[#2D2D2D] hover:border-[#0078D4]" 
              : "bg-white hover:bg-slate-50 border-[#EDEBE9] hover:border-[#0078D4] shadow-sm hover:shadow"
          }`}
          title={selectedCountry === "All" ? `Click to filter by ${displayHubCountry}` : "Click to clear filter and show all hubs"}
        >
          <span className="text-[10.5px] font-bold text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Globe size={12} className="text-indigo-500" />
              {selectedCountry === "All" ? "Primary Talent Hub" : "Selected Talent Hub"}
            </span>
            <span className="text-[8px] font-black uppercase text-[#0078D4]">
              {selectedCountry === "All" ? "Filter" : "Clear"}
            </span>
          </span>
          <div className="flex items-center gap-2 my-1">
            <span className="text-lg">{getFlag(displayHubCountry)}</span>
            <span className="text-base font-bold text-[#323130] dark:text-slate-100">{displayHubCountry}</span>
          </div>
          <span className="text-[9px] text-slate-400 font-medium">{displayHubCount} active professionals registered</span>
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
              <option value="All">All Countries / Hubs</option>
              {availableCountries.map((country) => (
                <option key={country} value={country}>
                  {getFlag(country)} {country}
                </option>
              ))}
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

      {/* Custom Non-blocking Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        sx={{
          "& .MuiDialog-paper": {
            bgcolor: isDark ? "#1F1F1F" : "#ffffff",
            color: isDark ? "#ffffff" : "#323130",
            border: `1px solid ${isDark ? "#2D2D2D" : "#EDEBE9"}`,
            borderRadius: "6px",
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: "bold", fontSize: "14px", borderBottom: `1px solid ${isDark ? "#2D2D2D" : "#EDEBE9"}` }}>
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ fontSize: "12.5px" }}>
            {confirmDialog.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${isDark ? "#2D2D2D" : "#EDEBE9"}`, p: 1.5 }}>
          <Button
            size="small"
            onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
            sx={{ textTransform: "none", fontWeight: "bold", color: isDark ? "#94A3B8" : "#475569" }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={() => {
              setConfirmDialog(prev => ({ ...prev, open: false }));
              confirmDialog.onConfirm();
            }}
            sx={{ textTransform: "none", fontWeight: "bold", bgcolor: "#0078D4", "&:hover": { bgcolor: "#005A9E" }, color: "#ffffff" }}
          >
            Proceed
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Non-blocking Alert Dialog */}
      <Dialog
        open={alertDialog.open}
        onClose={() => setAlertDialog(prev => ({ ...prev, open: false }))}
        sx={{
          "& .MuiDialog-paper": {
            bgcolor: isDark ? "#1F1F1F" : "#ffffff",
            color: isDark ? "#ffffff" : "#323130",
            border: `1px solid ${isDark ? "#2D2D2D" : "#EDEBE9"}`,
            borderRadius: "6px",
            minWidth: "280px"
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: "bold", fontSize: "14px", borderBottom: `1px solid ${isDark ? "#2D2D2D" : "#EDEBE9"}`, color: alertDialog.severity === "error" ? "#EF4444" : alertDialog.severity === "success" ? "#107C10" : "inherit" }}>
          {alertDialog.title}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ fontSize: "12.5px" }}>
            {alertDialog.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${isDark ? "#2D2D2D" : "#EDEBE9"}`, p: 1.5 }}>
          <Button
            size="small"
            variant="contained"
            onClick={() => setAlertDialog(prev => ({ ...prev, open: false }))}
            sx={{ textTransform: "none", fontWeight: "bold", bgcolor: "#0078D4", "&:hover": { bgcolor: "#005A9E" }, color: "#ffffff" }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Excel/CSV Upload Dialog */}
      <Dialog
        open={isBulkUploadOpen}
        onClose={() => {
          setIsBulkUploadOpen(false);
          setParsedEmployees([]);
          setFileName(null);
          setUploadError(null);
        }}
        maxWidth="md"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            bgcolor: isDark ? "#1F1F1F" : "#ffffff",
            color: isDark ? "#ffffff" : "#323130",
            border: `1px solid ${isDark ? "#2D2D2D" : "#EDEBE9"}`,
            borderRadius: "6px",
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: "bold", fontSize: "14px", borderBottom: `1px solid ${isDark ? "#2D2D2D" : "#EDEBE9"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="flex items-center gap-2">
            <FileSpreadsheet className="text-[#0078D4]" size={18} />
            Bulk Hydrate Employee Directory
          </span>
          <IconButton
            size="small"
            onClick={() => {
              setIsBulkUploadOpen(false);
              setParsedEmployees([]);
              setFileName(null);
              setUploadError(null);
            }}
            sx={{ color: isDark ? "#94A3B8" : "#475569" }}
          >
            <X size={16} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {!fileName ? (
            <div className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center flex flex-col items-center justify-center cursor-pointer transition ${
                  dragActive
                    ? "border-[#0078D4] bg-[#0078D4]/5"
                    : isDark
                    ? "border-[#2D2D2D] hover:border-[#4D4D4D] bg-[#151515]"
                    : "border-slate-300 hover:border-[#0078D4] bg-slate-50"
                }`}
                onClick={() => document.getElementById("manpower_bulk_file_input")?.click()}
              >
                <input
                  type="file"
                  id="manpower_bulk_file_input"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <FileSpreadsheet className={`w-12 h-12 mb-3 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                <Typography variant="subtitle2" className="font-bold" sx={{ fontSize: "13px" }}>
                  Drag & Drop Manpower Spreadsheet here
                </Typography>
                <Typography variant="body2" sx={{ fontSize: "11px", color: "text.secondary", mt: 0.5 }}>
                  or click to browse your local computer
                </Typography>
                <Typography variant="body2" sx={{ fontSize: "10px", color: "text.secondary", mt: 2, fontStyle: "italic" }}>
                  Supports Microsoft Excel (.xlsx, .xls) and standard CSV files.
                </Typography>
              </div>

              {/* Sample Headers */}
              <div className={`p-3 rounded border text-[11px] ${isDark ? "bg-[#181818] border-[#2D2D2D]" : "bg-slate-50 border-slate-200"}`}>
                <p className="font-bold mb-1 flex items-center gap-1.5">
                  <AlertCircle size={12} className="text-[#0078D4]" />
                  Supported Excel Column Formats:
                </p>
                <p className="text-slate-400 mb-2">
                  The spreadsheet parser automatically maps column headers. For best results, include a header row with the following column names:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-left">
                  <div>
                    <span className="font-mono text-[10px] bg-slate-700/10 dark:bg-slate-300/10 px-1 py-0.5 rounded text-[#0078D4]">Employee ID</span> (e.g. EMP-101)
                  </div>
                  <div>
                    <span className="font-mono text-[10px] bg-slate-700/10 dark:bg-slate-300/10 px-1 py-0.5 rounded text-[#0078D4]">Name</span> (e.g. John Doe)
                  </div>
                  <div>
                    <span className="font-mono text-[10px] bg-slate-700/10 dark:bg-slate-300/10 px-1 py-0.5 rounded text-[#0078D4]">Country</span> (e.g. India)
                  </div>
                  <div>
                    <span className="font-mono text-[10px] bg-slate-700/10 dark:bg-slate-300/10 px-1 py-0.5 rounded text-[#0078D4]">Department</span> (e.g. Engineering)
                  </div>
                  <div>
                    <span className="font-mono text-[10px] bg-slate-700/10 dark:bg-slate-300/10 px-1 py-0.5 rounded text-[#0078D4]">Title</span> (e.g. Lead Designer)
                  </div>
                  <div>
                    <span className="font-mono text-[10px] bg-slate-700/10 dark:bg-slate-300/10 px-1 py-0.5 rounded text-[#0078D4]">Salary</span> (e.g. 120000)
                  </div>
                  <div>
                    <span className="font-mono text-[10px] bg-slate-700/10 dark:bg-slate-300/10 px-1 py-0.5 rounded text-[#0078D4]">Status</span> (e.g. Active)
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected File Status */}
              <div className={`p-3 rounded border flex items-center justify-between ${uploadError ? "bg-rose-500/5 border-rose-500/20 text-rose-400" : isDark ? "bg-[#181818] border-[#2D2D2D]" : "bg-slate-50 border-slate-200"}`}>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className={uploadError ? "text-rose-400" : "text-[#0078D4]"} size={20} />
                  <div>
                    <p className="text-[12px] font-bold">{fileName}</p>
                    <p className="text-[10px] text-slate-400">
                      {uploadError ? "File processing failed" : `Successfully parsed ${parsedEmployees.length} employee records`}
                    </p>
                  </div>
                </div>
                <Button
                  size="small"
                  variant="outlined"
                  color={uploadError ? "error" : "inherit"}
                  onClick={() => {
                    setFileName(null);
                    setParsedEmployees([]);
                    setUploadError(null);
                  }}
                  sx={{ textTransform: "none", fontSize: "11px", py: 0.5 }}
                >
                  Choose Another
                </Button>
              </div>

              {uploadError && (
                <div className={`p-3 rounded border text-[12px] bg-rose-500/10 border-rose-500/20 text-rose-400`}>
                  <strong>Error: </strong> {uploadError}
                </div>
              )}

              {parsedEmployees.length > 0 && (
                <div>
                  <p className="text-[12px] font-bold mb-1.5 text-slate-400">Previewing first 5 rows to import:</p>
                  <div className="overflow-x-auto border rounded border-slate-700/20 dark:border-slate-300/10">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className={`${isDark ? "bg-[#181818] text-slate-300" : "bg-slate-100 text-slate-700"} border-b border-slate-700/20 dark:border-slate-300/10`}>
                          <th className="p-2 font-bold">Employee ID</th>
                          <th className="p-2 font-bold">Name</th>
                          <th className="p-2 font-bold">Country</th>
                          <th className="p-2 font-bold">Department</th>
                          <th className="p-2 font-bold">Title</th>
                          <th className="p-2 font-bold text-right">Salary</th>
                          <th className="p-2 font-bold text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/20 dark:divide-slate-300/10">
                        {parsedEmployees.slice(0, 5).map((emp, index) => (
                          <tr key={index} className={isDark ? "hover:bg-[#252525]" : "hover:bg-slate-50"}>
                            <td className="p-2 font-mono">{emp.id}</td>
                            <td className="p-2 font-medium">{emp.name}</td>
                            <td className="p-2">{emp.country}</td>
                            <td className="p-2">{emp.department}</td>
                            <td className="p-2">{emp.title}</td>
                            <td className="p-2 text-right font-mono">${emp.salary.toLocaleString()}</td>
                            <td className="p-2 text-center">
                              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${emp.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"}`}>
                                {emp.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedEmployees.length > 5 && (
                    <p className="text-[10px] text-slate-400 mt-1 text-right">
                      ...and {parsedEmployees.length - 5} more records.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>

        <DialogActions sx={{ borderTop: `1px solid ${isDark ? "#2D2D2D" : "#EDEBE9"}`, p: 1.5 }}>
          <Button
            size="small"
            onClick={() => {
              setIsBulkUploadOpen(false);
              setParsedEmployees([]);
              setFileName(null);
              setUploadError(null);
            }}
            sx={{ textTransform: "none", fontWeight: "bold", color: isDark ? "#94A3B8" : "#475569" }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            disabled={parsedEmployees.length === 0}
            onClick={handleBulkUploadConfirm}
            sx={{ textTransform: "none", fontWeight: "bold", bgcolor: "#107C10", "&:hover": { bgcolor: "#0B590B" }, color: "#ffffff", "&.Mui-disabled": { bgcolor: isDark ? "#2D2D2D" : "#EDEBE9", color: isDark ? "#666" : "#999" } }}
          >
            Import {parsedEmployees.length} Records
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
