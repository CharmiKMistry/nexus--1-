import React, { useState, useEffect, useMemo } from "react";
import { ThemeProvider, createTheme, CssBaseline, Snackbar, Alert } from "@mui/material";
import { 
  Country, 
  Employee,
  ValidationResult, 
  ReconciliationResult, 
  AuditLog, 
  UserRole,
  NotificationItem 
} from "./types";

// Import custom sub-views
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Copilot from "./components/Copilot";
import DashboardView from "./components/DashboardView";
import ManpowerView from "./components/ManpowerView";
import DataIntegrationView from "./components/DataIntegrationView";
import ValidationView from "./components/ValidationView";
import ReconciliationView from "./components/ReconciliationView";
import RuleEngineView from "./components/RuleEngineView";
import WorkflowView from "./components/WorkflowView";
import AgentView from "./components/AgentView";
import AnalyticsView from "./components/AnalyticsView";
import AdminConsoleView from "./components/AdminConsoleView";
import LoginView from "./components/LoginView";

// NEXUS Enterprise Views
import PayrollEventCenter from "./components/PayrollEventCenter";
import ApprovalCenter from "./components/ApprovalCenter";
import PayrollReadiness from "./components/PayrollReadiness";
import ComplianceAudit from "./components/ComplianceAudit";
import ReportsView from "./components/ReportsView";
import IntegrationHub from "./components/IntegrationHub";
import AiPayrollAssistant from "./components/AiPayrollAssistant";
import TimesheetPortal from "./components/TimesheetPortal";

import { NexusDB } from "./lib/db";

// Icons for notification panel
import { Bell, X, ShieldAlert, CheckCircle, Info, Sparkles } from "lucide-react";

import { LocalizationProvider, useLocalization } from "./components/LocalizationContext";
import UserPreferencesView from "./components/UserPreferencesView";

interface AppContentProps {
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
}

export function AppContent({ theme, setTheme }: AppContentProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>("Super Admin");
  const [globalSearch, setGlobalSearch] = useState("");
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // Material UI Toaster/Snackbar alert state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({
    open: false,
    message: "",
    severity: "info"
  });

  // Enterprise SSO and RBAC configurations
  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    const saved = sessionStorage.getItem("nexus_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [permissionsMatrix, setPermissionsMatrix] = useState<any[]>([]);
  const [sessionTimeout, setSessionTimeout] = useState(15); // Auto-logout in minutes

  const muiTheme = useMemo(() => {
    return createTheme({
      palette: {
        mode: theme,
        primary: {
          main: "#0078D4",
        },
        background: {
          default: theme === "dark" ? "#111111" : "#FAF9F8",
          paper: theme === "dark" ? "#1F1F1F" : "#FFFFFF",
        },
        text: {
          primary: theme === "dark" ? "#F5F5F5" : "#323130",
          secondary: theme === "dark" ? "#9CA3AF" : "#6B7280",
        },
      },
      typography: {
        fontFamily: "'Inter', 'Roboto', 'Segoe UI', sans-serif",
      },
    });
  }, [theme]);

  // Global alert monkeypatch to redirect to Material UI Snackbar
  useEffect(() => {
    window.alert = (message: string) => {
      if (!message) return;
      let severity: "success" | "error" | "warning" | "info" = "info";
      let cleanMsg = message;
      if (message.includes("✓") || message.toLowerCase().includes("success") || message.toLowerCase().includes("completed") || message.toLowerCase().includes("saved") || message.toLowerCase().includes("reset")) {
        severity = "success";
        cleanMsg = message.replace("✓", "").trim();
      } else if (message.includes("❌") || message.toLowerCase().includes("fail") || message.toLowerCase().includes("error") || message.toLowerCase().includes("revoked")) {
        severity = "error";
        cleanMsg = message.replace("❌", "").trim();
      } else if (message.toLowerCase().includes("warning") || message.toLowerCase().includes("attention") || message.toLowerCase().includes("expired")) {
        severity = "warning";
      }
      setSnackbar({
        open: true,
        message: cleanMsg,
        severity
      });
    };
  }, []);

  // Load Permissions matrix dynamically
  useEffect(() => {
    async function loadPermissions() {
      try {
        const res = await fetch("/api/permissions");
        const data = await res.json();
        setPermissionsMatrix(data);
      } catch (err) {
        console.error("Failed to load permissions matrix:", err);
      }
    }
    loadPermissions();
  }, []);

  // Synchronize active role on user login/switch
  useEffect(() => {
    if (currentUser) {
      const savedRole = sessionStorage.getItem("nexus_role");
      if (savedRole) {
        setCurrentRole(savedRole as UserRole);
      } else if (currentUser.roles && currentUser.roles.length > 0) {
        const defaultRole = currentUser.roles[0];
        setCurrentRole(defaultRole as UserRole);
        sessionStorage.setItem("nexus_role", defaultRole);
      }
    }
  }, [currentUser]);

  // Enterprise Inactivity Session Auto-logout
  useEffect(() => {
    if (!currentUser) return;

    let timeoutId: any;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleSignOut();
        alert("Your session has expired due to inactivity. For enterprise security compliance, your Microsoft Entra ID session has been terminated.");
      }, sessionTimeout * 60 * 1000);
    };

    resetTimer();

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach(name => window.addEventListener(name, resetTimer));

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(name => window.removeEventListener(name, resetTimer));
    };
  }, [currentUser, sessionTimeout]);

  // Client-Side Tab Protection Check
  useEffect(() => {
    if (!currentUser) return;
    if (currentRole === "Super Admin") return; // Super admin bypasses checks

    const rolePermissionsObj = permissionsMatrix.find(r => r.role === currentRole);
    const perms = rolePermissionsObj ? rolePermissionsObj.permissions : null;
    if (!perms) return;

    let allowed = true;
    switch (activeTab) {
      case "upload":
      case "events":
      case "integration":
        allowed = !!perms["Payroll Upload"];
        break;
      case "validation":
        allowed = !!perms["Validation"];
        break;
      case "reconciliation":
      case "approval":
      case "readiness":
        allowed = !!perms["Approvals"];
        break;
      case "rules":
        allowed = !!perms["Country Rules"];
        break;
      case "compliance":
        allowed = !!perms["Audit"];
        break;
      case "reports":
        allowed = !!perms["Reports"];
        break;
      case "admin":
        allowed = !!perms["Administration"];
        break;
      default:
        allowed = true; // Dashboard, manpower, copilot are public utilities
    }

    if (!allowed) {
      setActiveTab("dashboard");
      console.warn(`Redirected to dashboard: Tab '${activeTab}' is restricted for active role: ${currentRole}`);
    }
  }, [activeTab, currentRole, permissionsMatrix, currentUser]);

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    sessionStorage.setItem("nexus_role", role);
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    sessionStorage.removeItem("nexus_user");
    sessionStorage.removeItem("nexus_role");
  };

  // Core global database-backed datasets
  const [countries, setCountries] = useState<Country[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [validations, setValidations] = useState<ValidationResult[]>([]);
  const [reconciliations, setReconciliations] = useState<ReconciliationResult[]>([]);
  const [activePeriod, setActivePeriodState] = useState<string>(() => sessionStorage.getItem("nexus_active_period") || "July 2026");

  const setActivePeriod = (period: string) => {
    setActivePeriodState(period);
    sessionStorage.setItem("nexus_active_period", period);
  };
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: "n-1", title: "Compliance Breach Flagged", message: "Germany daily maximum limit exceeded (11.5 hours) for Employee Anna Weber.", type: "error", timestamp: "03:15 UTC", read: false },
    { id: "n-2", title: "CPF Inconsistency Aligned", message: "AI suggested retro CPF adjustment of S$ 250.00 pending audit approval.", type: "warning", timestamp: "03:16 UTC", read: false },
    { id: "n-3", title: "SuccessFactors Sync", message: "Successfully ingested 240 sales records from SuccessFactors pipeline.", type: "success", timestamp: "Yesterday", read: true }
  ]);

  // Load backend data on first run
  useEffect(() => {
    async function loadData() {
      try {
        const countryRes = await fetch("/api/countries");
        const countryList = await countryRes.json();
        setCountries(countryList.sort((a: Country, b: Country) => b.readinessScore - a.readinessScore));

        const employeeRes = await fetch("/api/employees");
        const employeeList = await employeeRes.json();
        setEmployees(employeeList);

        const validationRes = await fetch("/api/validation-results");
        const validationList = await validationRes.json();
        setValidations(validationList);

        const reconcileRes = await fetch("/api/reconciliation-results");
        const reconcileList = await reconcileRes.json();
        setReconciliations(reconcileList);
      } catch (err) {
        console.error("Error reading backend database records:", err);
      }
    }
    loadData();
  }, []);

  // Sync data refresh when Ingestion completes
  const handleIngestionRefresh = async () => {
    try {
      // Mutate USA entity status to show data is processing
      const usUpdate = {
        id: "us",
        name: "United States",
        flag: "🇺🇸",
        currency: "USD ($)",
        workingHours: 40,
        taxRules: "Federal income tax (10% to 37%), FICA (6.2% Social Security, 1.45% Medicare for both employee & employer), State and Local income taxes.",
        overtimePolicy: "1.5x hourly rate for non-exempt employees working over 40 hours per week under FLSA rules.",
        leavePolicy: "No statutory minimum paid leave. Left to employer/state policies.",
        holidayCalendar: "11 Federal Holidays (New Year's, Memorial Day, July 4th, Thanksgiving, Christmas, etc.)",
        payrollCalendar: "Semi-monthly on the 15th and last business day of the month.",
        workflow: ["HR Draft", "Finance Review", "Audit Clearance", "Executive Release"],
        readinessScore: 88,
        complianceScore: 82,
        dataQualityScore: 86,
        status: "Pending Verification",
        riskLevel: "Medium"
      };
      
      await fetch("/api/countries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usUpdate)
      });

      // 1. Create a brand new validation anomaly in database for John Doe (US)
      const newValObj: ValidationResult = {
        id: "val-4050",
        employeeId: "EMP-4050",
        employeeName: "John Doe",
        country: "United States",
        issueType: "FLSA Overtime Violation",
        severity: "High",
        confidenceScore: 97,
        explanation: "Worked 62 hours this week. Federal FLSA laws require 1.5x premium rate for all hours exceeding 40. Current timesheet payload does not specify the premium modifier.",
        recommendedResolution: "Recalculate timesheet hourly rate for 22 excess hours at 1.5x of $45.00/hr ($1,485.00 adjustment).",
        status: "Pending",
        period: activePeriod
      };
      await fetch("/api/validation-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newValObj)
      });

      // 2. Create a brand new reconciliation result in database for John Doe (US)
      const newRecObj: ReconciliationResult = {
        id: "rec-4050",
        employeeId: "EMP-4050",
        name: "John Doe",
        source: "Timesheets (62h)",
        target: "HRMS (40h)",
        discrepancy: "+22.0 hrs Overtime Variance",
        type: "Overtime Reconciliation",
        confidence: 95,
        aiRecommendation: "Authorize 22 hours overtime premium pay. Verified with corporate badge-in records showing office occupancy until 10:45 PM daily.",
        status: "Pending",
        period: activePeriod
      };
      await fetch("/api/reconciliation-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecObj)
      });

      // 3. Create a push notification
      const newNotif: NotificationItem = {
        id: `n-${Date.now()}`,
        title: "New Ingestion Anomalies Flagged",
        message: "NEXUS AI detected FLSA Overtime Violation for employee John Doe (United States) during July file ingestion.",
        type: "error",
        timestamp: "Just Now",
        read: false
      };

      // 4. Update state variables by refetching from DB
      const countryRes = await fetch("/api/countries");
      const countryList = await countryRes.json();
      setCountries(countryList.sort((a: Country, b: Country) => b.readinessScore - a.readinessScore));

      const validationRes = await fetch("/api/validation-results");
      const validationList = await validationRes.json();
      setValidations(validationList);

      const reconcileRes = await fetch("/api/reconciliation-results");
      const reconcileList = await reconcileRes.json();
      setReconciliations(reconcileList);

      setNotifications(prev => [newNotif, ...prev]);

    } catch (e) {
      console.error(e);
    }
  };

  // Mutate validation state in Database & UI
  const handleResolveValidation = async (id: string, newStatus: "Resolved" | "Ignored") => {
    try {
      // 1. Mutate record in database
      await fetch("/api/validation-results/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus })
      });

      // 2. Update React State
      setValidations(prev => prev.map(v => v.id === id ? { ...v, status: newStatus } : v));

      // 3. Increment Global score based on the anomaly
      const item = validations.find(v => v.id === id);
      if (item) {
        const countryId = item.country === "Germany" ? "de" : "us";
        const currentCountryObj = countries.find(c => c.id === countryId);
        if (currentCountryObj) {
          const nextScore = Math.min(100, currentCountryObj.readinessScore + 4);
          const nextStatus = nextScore >= 95 ? "Completed" : currentCountryObj.status;
          const nextRisk = nextScore >= 95 ? "Low" : currentCountryObj.riskLevel;

          const updatedCountry = {
            ...currentCountryObj,
            readinessScore: nextScore,
            status: nextStatus,
            riskLevel: nextRisk
          };

          await fetch("/api/countries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedCountry)
          });

          setCountries(prev => prev.map(c => c.id === countryId ? { 
            ...c, 
            readinessScore: nextScore, 
            status: nextStatus as any, 
            riskLevel: nextRisk as any 
          } : c));
        }

        // Write audit log to database
        await fetch("/api/audit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            user: `Ronak Surve (${currentRole})`,
            role: currentRole,
            action: `${newStatus} validation anomaly for ${item.employeeName}`,
            details: `Resolved statutory conflict: ${item.issueType}.`
          })
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Mutate reconciliation state in Database & UI
  const handleResolveReconciliation = async (id: string, newStatus: "Approved" | "Ignored") => {
    try {
      const item = reconciliations.find(r => r.id === id);
      if (item) {
        const updatedRec = { ...item, status: newStatus };
        await fetch("/api/reconciliation-results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedRec)
        });

        setReconciliations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));

        // Update Audit Log in database
        await fetch("/api/audit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            user: `Ronak Surve (${currentRole})`,
            role: currentRole,
            action: `Approved side-by-side reconciliation for ${item.name}`,
            details: `Discrepancy adjustment verified: ${item.discrepancy}.`
          })
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Core global handlers for manpower directory
  const handleSaveEmployee = async (emp: Employee) => {
    try {
      await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emp)
      });

      setEmployees(prev => {
        const exists = prev.some(e => e.id === emp.id);
        if (exists) {
          return prev.map(e => e.id === emp.id ? emp : e);
        }
        return [...prev, emp];
      });

      // Log action in audit logs
      await fetch("/api/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          user: `Ronak Surve (${currentRole})`,
          role: currentRole,
          action: `Saved employee record: ${emp.name} (${emp.id})`,
          details: `Country Hub: ${emp.country}, Department: ${emp.department}, Salary: ${emp.salary}, Status: ${emp.status}`
        })
      });
    } catch (err) {
      console.error("Failed to commit employee to backend:", err);
      // Fallback update state locally
      setEmployees(prev => {
        const exists = prev.some(e => e.id === emp.id);
        if (exists) return prev.map(e => e.id === emp.id ? emp : e);
        return [...prev, emp];
      });
    }
  };

  const handleDeleteEmployee = async (empId: string) => {
    try {
      await fetch(`/api/employees/${empId}`, {
        method: "DELETE"
      });
      setEmployees(prev => prev.filter(e => e.id !== empId));

      // Log action in audit logs
      await fetch("/api/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          user: `Ronak Surve (${currentRole})`,
          role: currentRole,
          action: `Deleted employee profile: ${empId}`,
          details: "Removed profile permanently from operational rosters."
        })
      });
    } catch (err) {
      console.error("Failed to delete employee from backend:", err);
      setEmployees(prev => prev.filter(e => e.id !== empId));
    }
  };

  const handleBulkSaveEmployees = async (newEmps: Employee[]) => {
    try {
      await fetch("/api/employees/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEmps)
      });

      setEmployees(prev => {
        const updated = [...prev];
        newEmps.forEach(emp => {
          const idx = updated.findIndex(e => e.id === emp.id);
          if (idx >= 0) {
            updated[idx] = emp;
          } else {
            updated.push(emp);
          }
        });
        return updated;
      });

      // Log action in audit logs
      await fetch("/api/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          user: `Ronak Surve (${currentRole})`,
          role: currentRole,
          action: `Bulk hydrated employee directory`,
          details: `Added/updated ${newEmps.length} synthetic employee records directly to the database.`
        })
      });
    } catch (err) {
      console.error("Failed to bulk save employees to backend:", err);
      // Fallback
      setEmployees(prev => {
        const updated = [...prev];
        newEmps.forEach(emp => {
          const idx = updated.findIndex(e => e.id === emp.id);
          if (idx >= 0) {
            updated[idx] = emp;
          } else {
            updated.push(emp);
          }
        });
        return updated;
      });
    }
  };

  const handleResetEmployees = async () => {
    try {
      const res = await fetch("/api/employees/reset", {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        setEmployees(data.employees);

        // Log action in audit logs
        await fetch("/api/audit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            user: `Ronak Surve (${currentRole})`,
            role: currentRole,
            action: `Reset employee directory`,
            details: "Wiped all employee records and reset the dynamic roster and indicators to zero for fresh spreadsheet upload."
          })
        });
      } else {
        throw new Error(data.error || "Reset endpoint returned success: false");
      }
    } catch (err) {
      console.error("Failed to reset employee directory:", err);
      throw err;
    }
  };

  // Reset database & seed to pristine state dynamically on the backend
  const handleResetDatabase = async (isDynamic: boolean = false, loadHistoric: boolean = false): Promise<boolean> => {
    try {
      const res = await fetch("/api/mongodb/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDynamic, loadHistoric })
      });
      const data = await res.json();
      
      // Refresh all state variables
      const countryRes = await fetch("/api/countries");
      const countryList = await countryRes.json();
      setCountries(countryList.sort((a: Country, b: Country) => b.readinessScore - a.readinessScore));

      const employeeRes = await fetch("/api/employees");
      const employeeList = await employeeRes.json();
      setEmployees(employeeList);

      const validationRes = await fetch("/api/validation-results");
      const validationList = await validationRes.json();
      setValidations(validationList);

      const reconcileRes = await fetch("/api/reconciliation-results");
      const reconcileList = await reconcileRes.json();
      setReconciliations(reconcileList);

      return data.success;
    } catch (err) {
      console.error("Database reset failed:", err);
      return false;
    }
  };

  const handlePurgeDatabase = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/database/purge-all", {
        method: "POST"
      });
      const data = await res.json();
      
      // Wipe NexusDB client-side
      NexusDB.purgeAll();

      // Refresh all state variables to empty
      setEmployees([]);
      setValidations([]);
      setReconciliations([]);
      
      // Keep countries list but we can refresh them
      const countryRes = await fetch("/api/countries");
      const countryList = await countryRes.json();
      setCountries(countryList.sort((a: Country, b: Country) => b.readinessScore - a.readinessScore));

      return data.success;
    } catch (err) {
      console.error("Database purge failed:", err);
      return false;
    }
  };

  const activeNotifCount = notifications.filter(n => !n.read).length;

  // View router mapping the 14 Sidebar items
  const renderActiveView = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardView
            countries={countries}
            setCountries={setCountries}
            currentRole={currentRole}
            theme={theme}
            onTabChange={setActiveTab}
            employees={employees}
            validations={validations}
            onResolveValidation={handleResolveValidation}
            activePeriod={activePeriod}
          />
        );
      case "manpower":
        return (
          <ManpowerView
            employees={employees}
            onSaveEmployee={handleSaveEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onBulkSaveEmployees={handleBulkSaveEmployees}
            onResetEmployees={handleResetEmployees}
            currentRole={currentRole}
            theme={theme}
          />
        );
      case "client_timesheets":
        return <TimesheetPortal theme={theme} />;
      case "events":
        return <PayrollEventCenter theme={theme} />;
      case "upload":
        return <DataIntegrationView theme={theme} onIngestionComplete={handleIngestionRefresh} />;
      case "validation":
        return (
          <ValidationView
            validations={validations}
            onResolve={handleResolveValidation}
            theme={theme}
            activePeriod={activePeriod}
          />
        );
      case "reconciliation":
        return (
          <ReconciliationView
            reconciliations={reconciliations}
            onReconcile={handleResolveReconciliation}
            theme={theme}
            activePeriod={activePeriod}
          />
        );
      case "approval":
        return (
          <ApprovalCenter
            theme={theme}
            countries={countries}
            onCountriesUpdate={setCountries}
            currentRole={currentRole}
          />
        );
      case "readiness":
        return (
          <PayrollReadiness
            theme={theme}
            countries={countries}
            validations={validations.filter(v => v.period ? v.period === activePeriod : activePeriod === "July 2026")}
            reconciliations={reconciliations.filter(r => r.period ? r.period === activePeriod : activePeriod === "July 2026")}
            onTabChange={setActiveTab}
          />
        );
      case "rules":
        return <RuleEngineView countries={countries} setCountries={setCountries} theme={theme} />;
      case "compliance":
        return <ComplianceAudit theme={theme} />;
      case "reports":
        return <ReportsView theme={theme} />;
      case "integration":
        return <IntegrationHub theme={theme} />;
      case "copilot":
        return <AiPayrollAssistant theme={theme} />;
      case "preferences":
        return <UserPreferencesView />;
      case "admin":
        return (
          <AdminConsoleView
            theme={theme}
            onResetDatabase={handleResetDatabase}
            onPurgeDatabase={handlePurgeDatabase}
            currentRole={currentRole}
            onRoleChange={handleRoleChange}
          />
        );
      default:
        return (
          <DashboardView
            countries={countries}
            setCountries={setCountries}
            currentRole={currentRole}
            theme={theme}
            onTabChange={setActiveTab}
            employees={employees}
            validations={validations}
            onResolveValidation={handleResolveValidation}
            activePeriod={activePeriod}
          />
        );
    }
  };

  if (!currentUser) {
    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <LoginView
          theme={theme}
          setTheme={setTheme}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            sessionStorage.setItem("nexus_user", JSON.stringify(user));
            if (user.roles && user.roles.length > 0) {
              const defaultRole = user.roles[0];
              setCurrentRole(defaultRole as UserRole);
              sessionStorage.setItem("nexus_role", defaultRole);
            }
          }}
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <div className={`h-screen flex overflow-hidden font-sans ${theme === "dark" ? "dark bg-[#111111] text-[#F5F5F5]" : "light bg-[#FAF9F8] text-[#323130]"}`} id="nexus_app_root">
        {/* Sidebar navigation */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          collapsed={sidebarCollapsed} 
          setCollapsed={setSidebarCollapsed}
          theme={theme}
          currentRole={currentRole}
          permissionsMatrix={permissionsMatrix}
        />

        {/* Main workspace container */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Top Header */}
          <Header 
            currentRole={currentRole} 
            setCurrentRole={handleRoleChange} 
            theme={theme} 
            setTheme={setTheme}
            globalSearch={globalSearch}
            setGlobalSearch={setGlobalSearch}
            notificationsCount={activeNotifCount}
            onOpenNotifications={() => setShowNotifPanel(true)}
            currentUser={currentUser}
            onSignOut={handleSignOut}
            employees={employees}
            countries={countries}
            validations={validations}
            reconciliations={reconciliations}
            setActiveTab={setActiveTab}
            activePeriod={activePeriod}
            setActivePeriod={setActivePeriod}
          />

          {/* Scrollable Workspace */}
          <main className="flex-1 overflow-y-auto p-4 scrollbar-thin">
            <div className="max-w-7xl mx-auto space-y-4">
              {renderActiveView()}
            </div>
          </main>

          {/* Floating Copilot launcher */}
          <Copilot theme={theme} />

          {/* In-App Notifications Drawer (Microsoft Style slide out panel) */}
          {showNotifPanel && (
            <div className={`absolute inset-y-0 right-0 w-80 shadow-2xl z-50 flex flex-col border-l transition-all ${
              theme === "dark" ? "bg-[#1F1F1F] border-[#2D2D2D] text-slate-100" : "bg-white border-[#EDEBE9] text-[#323130]"
            }`} id="notification_drawer">
              <div className={`p-3 border-b flex items-center justify-between ${theme === "dark" ? "border-[#2D2D2D]" : "border-[#EDEBE9]"}`}>
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-400">
                  <Bell size={13} className="text-[#0078D4]" />
                  Governance Alerts
                </span>
                <button 
                  onClick={() => setShowNotifPanel(false)}
                  className={`p-1 rounded-full transition-colors ${theme === "dark" ? "hover:bg-[#2D2D2D]" : "hover:bg-slate-100"}`}
                  id="close_notif_drawer_btn"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {notifications.map((n) => (
                  <div 
                    key={n.id}
                    onClick={() => {
                      setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif));
                    }}
                    className={`p-2.5 rounded border text-xs cursor-pointer transition-all ${
                      n.read 
                        ? (theme === "dark" ? "bg-[#2D2D2D]/40 border-[#2D2D2D] opacity-60" : "bg-[#F3F2F1]/55 border-[#EDEBE9] opacity-60 text-slate-400") 
                        : (theme === "dark" ? "bg-[#2D2D2D] border-[#0078D4]/40 shadow-sm" : "bg-[#EFF6FC] border-[#0078D4]/30 shadow-sm")
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold uppercase text-[8px] ${
                        n.type === "error" ? "text-rose-600" : n.type === "warning" ? "text-amber-600" : "text-emerald-600"
                      }`}>
                        {n.type} Alert
                      </span>
                      <span className="text-[8px] text-slate-400">{n.timestamp}</span>
                    </div>
                    <h4 className={`font-bold ${theme === "dark" ? "text-slate-100" : "text-[#323130]"}`}>{n.title}</h4>
                    <p className={`text-[11px] mt-0.5 leading-relaxed ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{n.message}</p>
                  </div>
                ))}
              </div>

              <div className={`p-3 border-t text-center ${theme === "dark" ? "border-[#2D2D2D]" : "border-[#EDEBE9]"}`}>
                <button 
                  onClick={() => {
                    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                    setShowNotifPanel(false);
                  }}
                  className="text-xs text-[#0078D4] hover:underline font-bold"
                >
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Material UI Alert Toast */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%", fontWeight: 700, fontSize: "12px", boxShadow: 3 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

function AppContentWrapper({ theme, setTheme }: AppContentProps) {
  const { language } = useLocalization();
  return <AppContent key={language} theme={theme} setTheme={setTheme} />;
}

export default function App() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  
  return (
    <LocalizationProvider themeState={theme} setThemeState={setTheme}>
      <AppContentWrapper theme={theme} setTheme={setTheme} />
    </LocalizationProvider>
  );
}
