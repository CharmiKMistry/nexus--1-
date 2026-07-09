export type UserRole = 
  | "Super Admin"
  | "Payroll Administrator"
  | "Payroll Admin"
  | "Country Payroll Administrator"
  | "Country Admin"
  | "HR"
  | "Finance"
  | "Compliance Officer"
  | "Auditor"
  | "Executive Leadership"
  | "Executive"
  | "Business Manager"
  | "Client Manager"
  | "LTTS Project Manager"
  | "Employee";

export interface Country {
  id: string;
  name: string;
  flag: string;
  currency: string;
  workingHours: number;
  taxRules: string;
  overtimePolicy: string;
  leavePolicy: string;
  holidayCalendar: string;
  payrollCalendar: string;
  workflow: string[];
  readinessScore: number;
  complianceScore: number;
  dataQualityScore: number;
  status: "Completed" | "Pending Approval" | "Validating" | "Pending Verification" | "Draft";
  riskLevel: "Low" | "Medium" | "High";
}

export interface Employee {
  id: string;
  name: string;
  country: string;
  department: string;
  title: string;
  salary: number;
  status: string;
}

export interface Rule {
  id: string;
  country: string;
  code: string;
  category: string;
  limit: number;
  penalty: string;
  description: string;
}

export interface ValidationResult {
  id: string;
  employeeId: string;
  employeeName: string;
  country: string;
  issueType: string;
  severity: "High" | "Medium" | "Low";
  confidenceScore: number;
  explanation: string;
  recommendedResolution: string;
  status: "Pending" | "Resolved" | "Ignored";
}

export interface ReconciliationResult {
  id: string;
  employeeId: string;
  name: string;
  source: string;
  target: string;
  discrepancy: string;
  type: string;
  confidence: number;
  aiRecommendation: string;
  status: "Pending" | "Approved" | "Ignored";
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  details: string;
}

export interface AgentState {
  name: string;
  status: "idle" | "running" | "success" | "warning" | "error";
  progress: number;
  currentTask: string;
  executionLogs: string[];
}

export interface WorkflowNode {
  id: string;
  label: string;
  assignedRole: UserRole;
  slaDays: number;
  status: "pending" | "completed" | "active";
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "warning" | "error" | "info" | "success";
  timestamp: string;
  read: boolean;
}
