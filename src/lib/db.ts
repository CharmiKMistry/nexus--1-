import { Country, Employee, ValidationResult, ReconciliationResult, AuditLog, NotificationItem } from "../types";

// --- Enterprise MongoDB Emulation Layer ---

export interface EmployeeProfile extends Employee {
  email: string;
  grade: string;
  bankDetails: string;
  joiningDate: string;
}

export interface PayrollEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  country: string;
  type: "New Joiner" | "Salary Change" | "Promotion" | "Variable Pay" | "Retention Pay" | "Sales Award" | "Recovery" | "Overtime" | "Resignation";
  status: "Draft" | "Uploaded" | "AI Validated" | "Manager Approved" | "HR Approved" | "Payroll Approved" | "Completed" | "Rejected";
  timestamp: string;
  comments: string;
  supportingDocs: string;
  workflowStep: string;
  slaDays: number;
  timeline: { step: string; status: string; date: string; user: string; comments?: string }[];
}

// Sub-event schemas
export interface SalaryChangeEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  oldSalary: number;
  newSalary: number;
  effectiveDate: string;
  reason: string;
}

export interface NewJoinerEvent {
  id: string;
  employeeId: string;
  name: string;
  country: string;
  joiningDate: string;
  grade: string;
  baseSalary: number;
  email: string;
}

export interface PromotionEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  oldGrade: string;
  newGrade: string;
  newDesignation: string;
  effectiveDate: string;
}

export interface VariablePayEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  performanceRating: number;
  fiscalQuarter: string;
}

export interface RetentionPayEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  retentionPeriodMonths: number;
  lockInDate: string;
}

export interface RecoveryEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  recoveryAmount: number;
  reason: string;
  installmentsCount: number;
}

export interface SalesAwardEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  awardAmount: number;
  quarter: string;
  sourceCRM: string;
}

export interface OvertimeEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  overtimeHours: number;
  hourlyRate: number;
  otDate: string;
}

export interface ResignationEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  resignationDate: string;
  lastWorkingDate: string;
  leaveEncashmentDays: number;
}

export interface ApprovalAction {
  id: string;
  eventId: string;
  approverName: string;
  role: string;
  status: string;
  timestamp: string;
  comments: string;
}

export interface ValidationLog {
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

export interface CountryRule {
  id: string; // "in"
  name: string;
  flag: string;
  currency: string;
  timezone: string;
  payrollFrequency: string;
  workingHours: number;
  overtimeRules: string;
  holidayRules: string;
  taxRules: string;
  approvalWorkflow: string[];
  validationRules: string[];
  exchangeRateUSD: number;
}

export interface ExchangeRateHistory {
  id: string;
  currencyCode: string;
  rateToUSD: number;
  lastUpdated: string;
  history: { date: string; rate: number }[];
}

export interface PayrollReport {
  id: string;
  name: string;
  type: string;
  generatedAt: string;
  size: string;
  format: "Excel" | "CSV" | "PDF";
  downloadUrl: string;
  status: "Ready" | "Generating";
}

// --- Initial Seed Datasets (All Cleaned to India Only) ---

export const SEED_EMPLOYEES: EmployeeProfile[] = [
  { id: "EMP-1042", name: "Amit Gupta", country: "India", department: "Engineering", title: "Principal Architect", salary: 185000, status: "Active", email: "amit.gupta@nexus-corp.in", grade: "Grade 8", bankDetails: "ICICI IN Mumbai 0910-22", joiningDate: "2023-04-15" },
  { id: "EMP-2109", name: "Sai Gupta", country: "India", department: "Product", title: "Product Lead", salary: 158000, status: "Active", email: "sai.gupta@nexus-corp.in", grade: "Grade 9", bankDetails: "HDFC IN Bengaluru 0834-11", joiningDate: "2022-09-01" },
  { id: "EMP-0098", name: "Sneha Patel", country: "India", department: "Sales", title: "VP Global Sales", salary: 225000, status: "Active", email: "sneha.patel@nexus-corp.in", grade: "Grade 10", bankDetails: "SBI IN Ahmedabad 4810-48", joiningDate: "2021-01-10" },
  { id: "EMP-3045", name: "Rohan Sharma", country: "India", department: "Operations", title: "Director of Ops", salary: 195000, status: "Active", email: "rohan.sharma@nexus-corp.in", grade: "Grade 7", bankDetails: "Axis IN Pune 901-44", joiningDate: "2020-11-20" },
  { id: "EMP-1204", name: "Ananya Joshi", country: "India", department: "Marketing", title: "Senior Manager", salary: 120000, status: "Active", email: "ananya.joshi@nexus-corp.in", grade: "Grade 8", bankDetails: "ICICI IN Noida 892-02", joiningDate: "2024-02-01" },
  { id: "EMP-4050", name: "Sai Sharma", country: "India", department: "Sales", title: "Sales Executive", salary: 95000, status: "Active", email: "sai.sharma@nexus-corp.in", grade: "Grade 7", bankDetails: "PNB IN Delhi 9012-34", joiningDate: "2025-05-15" },
  { id: "EMP-5011", name: "Priya Patel", country: "India", department: "Operations", title: "Operations Analyst", salary: 110000, status: "Active", email: "priya.patel@nexus-corp.in", grade: "Grade 8", bankDetails: "HDFC IN Vadodara 4820-22", joiningDate: "2024-10-01" },
  { id: "EMP-6022", name: "Karan Gupta", country: "India", department: "Engineering", title: "Lead Developer", salary: 165000, status: "Active", email: "karan.gupta@nexus-corp.in", grade: "Grade 9", bankDetails: "SBI IN Gurugram 9920-11", joiningDate: "2022-03-01" },
  { id: "EMP-7033", name: "Karan Patel", country: "India", department: "Marketing", title: "Design Director", salary: 145000, status: "Active", email: "karan.patel@nexus-corp.in", grade: "Grade 8", bankDetails: "ICICI IN Hyderabad 482-10", joiningDate: "2023-08-15" },
  { id: "EMP-8044", name: "Amit Patel", country: "India", department: "Support", title: "Support Manager", salary: 85000, status: "Active", email: "amit.patel@nexus-corp.in", grade: "Grade 7", bankDetails: "ICICI IN Mumbai 0910-22", joiningDate: "2021-06-15" }
];

export const SEED_COUNTRY_RULES: CountryRule[] = [
  {
    id: "in",
    name: "India",
    flag: "🇮🇳",
    currency: "INR (₹)",
    timezone: "IST (UTC+5:30)",
    payrollFrequency: "Monthly",
    workingHours: 48,
    overtimeRules: "Double the normal rate of wages for hours worked beyond 9 hours in a day or 48 hours in a week under the Factories Act.",
    holidayRules: "3 National Holidays (Republic Day, Independence Day, Gandhi Jayanti) + statutory regional festival holidays.",
    taxRules: "New Tax Regime slab rates from 0% to 30%. Provident Fund (EPF) at 12% employee and employer contribution.",
    approvalWorkflow: ["HR Specialist", "Finance Controller", "Payroll Manager"],
    validationRules: ["Valid Permanent Account Number (PAN) format", "Mandatory EPF enrollment if basic > ₹15,000", "No negative overtime hours"],
    exchangeRateUSD: 83.45
  }
];

export const SEED_EXCHANGE_RATES: ExchangeRateHistory[] = [
  { id: "ex_inr", currencyCode: "INR", rateToUSD: 83.45, lastUpdated: "2026-07-06 09:00", history: [{ date: "2026-07-02", rate: 83.52 }, { date: "2026-07-06", rate: 83.45 }] }
];

// Seed 9 sample events corresponding to India payroll context
export const SEED_PAYROLL_EVENTS: PayrollEvent[] = [
  {
    id: "evt-001",
    employeeId: "EMP-1042",
    employeeName: "Amit Gupta",
    country: "India",
    type: "Overtime",
    status: "AI Validated",
    timestamp: "2026-07-06 03:15",
    comments: "Mumbai Overtime Ingested via Excel Import.",
    supportingDocs: "Mumbai_Overtime_June2026.csv",
    workflowStep: "Compliance Officer",
    slaDays: 2,
    timeline: [
      { step: "Draft", status: "completed", date: "2026-07-05 10:00", user: "Amit Gupta" },
      { step: "Uploaded", status: "completed", date: "2026-07-06 03:15", user: "Ronak Surve" },
      { step: "AI Validated", status: "active", date: "2026-07-06 03:16", user: "NEXUS Core Agent" }
    ]
  },
  {
    id: "evt-002",
    employeeId: "EMP-2109",
    employeeName: "Sai Gupta",
    country: "India",
    type: "Variable Pay",
    status: "Manager Approved",
    timestamp: "2026-07-05 14:22",
    comments: "Q2 performance discretionary bonus payout.",
    supportingDocs: "IN_Product_Bonuses.xlsx",
    workflowStep: "HR Partner",
    slaDays: 3,
    timeline: [
      { step: "Uploaded", status: "completed", date: "2026-07-05 14:22", user: "Ronak Surve" },
      { step: "AI Validated", status: "completed", date: "2026-07-05 14:25", user: "NEXUS Core Agent" },
      { step: "Manager Approved", status: "active", date: "2026-07-05 16:30", user: "Rohan Sharma", comments: "Performance checks verified, approved." }
    ]
  },
  {
    id: "evt-003",
    employeeId: "EMP-0098",
    employeeName: "Sneha Patel",
    country: "India",
    type: "Sales Award",
    status: "HR Approved",
    timestamp: "2026-07-04 09:40",
    comments: "Sales VP Award closed-won quota incentive.",
    supportingDocs: "IN_SalesAwards_Q2.xlsx",
    workflowStep: "Payroll Admin",
    slaDays: 1,
    timeline: [
      { step: "Uploaded", status: "completed", date: "2026-07-04 09:40", user: "Sai Gupta" },
      { step: "AI Validated", status: "completed", date: "2026-07-04 09:45", user: "NEXUS Core Agent" },
      { step: "Manager Approved", status: "completed", date: "2026-07-04 11:15", user: "Sai Gupta" },
      { step: "HR Approved", status: "active", date: "2026-07-05 10:20", user: "Sneha Patel" }
    ]
  },
  {
    id: "evt-004",
    employeeId: "EMP-4050",
    employeeName: "Sai Sharma",
    country: "India",
    type: "New Joiner",
    status: "Draft",
    timestamp: "2026-07-06 09:00",
    comments: "New onboarding registration input from Workday.",
    supportingDocs: "Onboarding_IN_July.xlsx",
    workflowStep: "HR Specialist",
    slaDays: 5,
    timeline: [
      { step: "Draft", status: "active", date: "2026-07-06 09:00", user: "HR Onboarding System" }
    ]
  },
  {
    id: "evt-005",
    employeeId: "EMP-3045",
    employeeName: "Rohan Sharma",
    country: "India",
    type: "Salary Change",
    status: "Uploaded",
    timestamp: "2026-07-06 08:30",
    comments: "Base adjustment aligning with regional merit band shift.",
    supportingDocs: "Base_Adjustment_IN_July.pdf",
    workflowStep: "Manager Approval",
    slaDays: 3,
    timeline: [
      { step: "Draft", status: "completed", date: "2026-07-05 17:00", user: "Rohan Sharma" },
      { step: "Uploaded", status: "active", date: "2026-07-06 08:30", user: "Rohan Sharma" }
    ]
  },
  {
    id: "evt-006",
    employeeId: "EMP-5011",
    employeeName: "Priya Patel",
    country: "India",
    type: "Promotion",
    status: "AI Validated",
    timestamp: "2026-07-05 11:20",
    comments: "Promoted to Lead Analyst, change of base salary & grade scale.",
    supportingDocs: "Promotion_Priya_P_IN.pdf",
    workflowStep: "Finance Auditor",
    slaDays: 4,
    timeline: [
      { step: "Uploaded", status: "completed", date: "2026-07-05 11:20", user: "India HR Manager" },
      { step: "AI Validated", status: "active", date: "2026-07-05 11:22", user: "NEXUS Core Agent" }
    ]
  },
  {
    id: "evt-007",
    employeeId: "EMP-8044",
    employeeName: "Amit Patel",
    country: "India",
    type: "Recovery",
    status: "Completed",
    timestamp: "2026-07-02 14:00",
    comments: "Clawback recovery on previous travel advance allowance overrun.",
    supportingDocs: "Clawback_Agreement_Amt.pdf",
    workflowStep: "Archived",
    slaDays: 0,
    timeline: [
      { step: "Uploaded", status: "completed", date: "2026-07-02 14:00", user: "Finance Auditor" },
      { step: "AI Validated", status: "completed", date: "2026-07-02 14:05", user: "NEXUS Core Agent" },
      { step: "Manager Approved", status: "completed", date: "2026-07-02 16:00", user: "Amit Patel" },
      { step: "HR Approved", status: "completed", date: "2026-07-03 10:00", user: "Finance Auditor" },
      { step: "Payroll Approved", status: "completed", date: "2026-07-03 12:30", user: "India Payroll Manager" },
      { step: "Completed", status: "completed", date: "2026-07-04 09:00", user: "NEXUS Automation Engine" }
    ]
  }
];

export const SEED_NEW_JOINERS: NewJoinerEvent[] = [
  { id: "evt-004", employeeId: "EMP-4050", name: "Sai Sharma", country: "India", joiningDate: "2025-05-15", grade: "Grade 7", baseSalary: 95000, email: "sai.sharma@nexus-corp.in" }
];

export const SEED_SALARY_CHANGES: SalaryChangeEvent[] = [
  { id: "evt-005", employeeId: "EMP-3045", employeeName: "Rohan Sharma", oldSalary: 185000, newSalary: 195000, effectiveDate: "2026-07-01", reason: "Annual Corporate Merit Adjustment" }
];

export const SEED_PROMOTIONS: PromotionEvent[] = [
  { id: "evt-006", employeeId: "EMP-5011", employeeName: "Priya Patel", oldGrade: "Grade 7", newGrade: "Grade 8", newDesignation: "Senior Operations Specialist", effectiveDate: "2026-07-01" }
];

export const SEED_VARIABLE_PAY: VariablePayEvent[] = [
  { id: "evt-002", employeeId: "EMP-2109", employeeName: "Sai Gupta", amount: 25000, performanceRating: 4.5, fiscalQuarter: "Q2 2026" }
];

export const SEED_RETENTION_PAY: RetentionPayEvent[] = [
  { id: "evt-008", employeeId: "EMP-1204", employeeName: "Ananya Joshi", amount: 45000, retentionPeriodMonths: 24, lockInDate: "2026-07-01" }
];

export const SEED_RECOVERIES: RecoveryEvent[] = [
  { id: "evt-007", employeeId: "EMP-8044", employeeName: "Amit Patel", recoveryAmount: 12000, reason: "Clawback of duplicate travel allowance disbursement", installmentsCount: 3 }
];

export const SEED_SALES_AWARDS: SalesAwardEvent[] = [
  { id: "evt-003", employeeId: "EMP-0098", employeeName: "Sneha Patel", awardAmount: 85000, quarter: "Q2 2026", sourceCRM: "Salesforce CRM" }
];

export const SEED_OVERTIME: OvertimeEvent[] = [
  { id: "evt-001", employeeId: "EMP-1042", employeeName: "Amit Gupta", overtimeHours: 12, hourlyRate: 450, otDate: "2026-07-02" }
];

export const SEED_RESIGNATIONS: ResignationEvent[] = [
  { id: "evt-009", employeeId: "EMP-6022", employeeName: "Karan Gupta", resignationDate: "2026-07-01", lastWorkingDate: "2026-08-15", leaveEncashmentDays: 14 }
];

export const SEED_VALIDATION_LOGS: ValidationLog[] = [
  {
    id: "val-1",
    employeeId: "EMP-1042",
    employeeName: "Amit Gupta",
    country: "India",
    issueType: "Overtime Violations",
    severity: "High",
    confidenceScore: 98,
    explanation: "Worked 12.0 hours in a single shift, exceeding the 9-hour daily threshold mandated by the India Factories Act.",
    recommendedResolution: "Apply double rate hourly compensation for 3 excess hours and issue a compliance clearance log.",
    status: "Pending"
  },
  {
    id: "val-2",
    employeeId: "EMP-2109",
    employeeName: "Sai Gupta",
    country: "India",
    issueType: "EPF Contribution Mismatch",
    severity: "Medium",
    confidenceScore: 95,
    explanation: "EPF calculated on basic salary is incorrect. Active payroll run calculated basic at 12% mismatch against verified statutory base salary.",
    recommendedResolution: "Apply retroactive adjustment of ₹2,500.00 to align with standard EPF rules.",
    status: "Pending"
  },
  {
    id: "val-3",
    employeeId: "EMP-0098",
    employeeName: "Sneha Patel",
    country: "India",
    issueType: "Base Salary Variance",
    severity: "High",
    confidenceScore: 92,
    explanation: "Ingested base salary of ₹2,25,000.00 for the month is 15% higher than the HRMS active contract base salary.",
    recommendedResolution: "Verify with global compensation team or apply retroactive adjustment.",
    status: "Pending"
  }
];

export const SEED_AUDIT_LOGS: AuditLog[] = [
  { id: "aud-001", timestamp: "2026-07-06T01:10:00Z", user: "Ronak Surve (Super Admin)", role: "Super Admin", action: "System Ingestion Initiated", details: "Ingested timecards and overtime records via Smart Excel Upload." },
  { id: "aud-002", timestamp: "2026-07-06T02:30:15Z", user: "NEXUS Agent Layer", role: "AI Validation Agent", action: "Automated scan performed", details: "Scanned 1420 files, identified India payroll exceptions" }
];

export const SEED_RECONCILIATIONS: ReconciliationResult[] = [
  {
    id: "rec-1",
    employeeId: "EMP-1042",
    name: "Amit Gupta",
    source: "Timesheets (168h)",
    target: "HRMS (160h)",
    discrepancy: "+8.0 hrs Variance",
    type: "Overtime Reconciliation",
    confidence: 94,
    aiRecommendation: "Authorize 8 hours overtime pay. Verified against automatic card badge-in security logs.",
    status: "Pending"
  },
  {
    id: "rec-2",
    employeeId: "EMP-2109",
    name: "Sai Gupta",
    source: "Claims (₹14,200.00)",
    target: "Policy Rule (₹10,000.00 Max)",
    discrepancy: "₹4,200.00 Policy Overrun",
    type: "Expense Inconsistency",
    confidence: 89,
    aiRecommendation: "Approve ₹10,000.00 standard limit and route ₹4,200.00 exception for Executive Sign-off.",
    status: "Pending"
  },
  {
    id: "rec-3",
    employeeId: "EMP-3045",
    name: "Rohan Sharma",
    source: "Salary Rev (₹1,95,000.00)",
    target: "Employee Master (₹1,85,000.00)",
    discrepancy: "+₹10,000.00 Merit Variance",
    type: "Salary Revision vs Employee Master",
    confidence: 97,
    aiRecommendation: "Approve the ₹1,95,000.00. Verified against signed contractual promo document (Ref: H-IN-7392).",
    status: "Pending"
  },
  {
    id: "rec-4",
    employeeId: "EMP-8044",
    name: "Amit Patel",
    source: "Variable Pay (₹85,000)",
    target: "Performance Master (Rating 2/5)",
    discrepancy: "Over-incentive exception",
    type: "Variable Pay vs Performance Rating",
    confidence: 91,
    aiRecommendation: "Withhold payment or audit. Discretionary payout of ₹85,000 exceeds standard ₹10,000 cap for Performance Rating 2/5.",
    status: "Pending"
  }
];

export const SEED_REPORTS: PayrollReport[] = [
  { id: "rep-001", name: "India_Payroll_Summary_July2026.pdf", type: "Payroll Summary", generatedAt: "2026-07-06 08:30", size: "1.4 MB", format: "PDF", downloadUrl: "#", status: "Ready" },
  { id: "rep-002", name: "Salary_Revision_Report_Q2.xlsx", type: "Salary Revision Report", generatedAt: "2026-07-05 11:00", size: "850 KB", format: "Excel", downloadUrl: "#", status: "Ready" }
];

export const SEED_NOTIFICATIONS: NotificationItem[] = [
  { id: "notif-1", title: "Compliance Breach Flagged", message: "India daily maximum limit exceeded (12 hours) for Employee Amit Gupta.", type: "error", timestamp: "03:15 UTC", read: false },
  { id: "notif-2", title: "EPF Inconsistency Aligned", message: "AI suggested EPF adjustment of ₹2,500.00 pending audit approval.", type: "warning", timestamp: "03:16 UTC", read: false }
];

// --- Database Engine Local State (In-Memory Fallback & Seed Helper) ---

export class NexusDB {
  public static employees = [...SEED_EMPLOYEES];
  public static countryRules = [...SEED_COUNTRY_RULES];
  public static exchangeRates = [...SEED_EXCHANGE_RATES];
  public static payrollEvents = [...SEED_PAYROLL_EVENTS];
  public static salaryChanges = [...SEED_SALARY_CHANGES];
  public static newJoiners = [...SEED_NEW_JOINERS];
  public static promotions = [...SEED_PROMOTIONS];
  public static variablePay = [...SEED_VARIABLE_PAY];
  public static retentionPay = [...SEED_RETENTION_PAY];
  public static recoveries = [...SEED_RECOVERIES];
  public static salesAwards = [...SEED_SALES_AWARDS];
  public static overtime = [...SEED_OVERTIME];
  public static resignations = [...SEED_RESIGNATIONS];
  public static validationLogs = [...SEED_VALIDATION_LOGS];
  public static auditLogs = [...SEED_AUDIT_LOGS];
  public static reconciliations = [...SEED_RECONCILIATIONS];
  public static reports = [...SEED_REPORTS];
  public static notifications = [...SEED_NOTIFICATIONS];

  // Restores all collections to base seed data instantly
  public static reset() {
    this.employees = JSON.parse(JSON.stringify(SEED_EMPLOYEES));
    this.countryRules = JSON.parse(JSON.stringify(SEED_COUNTRY_RULES));
    this.exchangeRates = JSON.parse(JSON.stringify(SEED_EXCHANGE_RATES));
    this.payrollEvents = JSON.parse(JSON.stringify(SEED_PAYROLL_EVENTS));
    this.salaryChanges = JSON.parse(JSON.stringify(SEED_SALARY_CHANGES));
    this.newJoiners = JSON.parse(JSON.stringify(SEED_NEW_JOINERS));
    this.promotions = JSON.parse(JSON.stringify(SEED_PROMOTIONS));
    this.variablePay = JSON.parse(JSON.stringify(SEED_VARIABLE_PAY));
    this.retentionPay = JSON.parse(JSON.stringify(SEED_RETENTION_PAY));
    this.recoveries = JSON.parse(JSON.stringify(SEED_RECOVERIES));
    this.salesAwards = JSON.parse(JSON.stringify(SEED_SALES_AWARDS));
    this.overtime = JSON.parse(JSON.stringify(SEED_OVERTIME));
    this.resignations = JSON.parse(JSON.stringify(SEED_RESIGNATIONS));
    this.validationLogs = JSON.parse(JSON.stringify(SEED_VALIDATION_LOGS));
    this.auditLogs = [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: "Ronak Surve (Super Admin)",
        role: "Super Admin",
        action: "One-Click Database Reset Triggered",
        details: "Wiped all custom data entries and re-seeded collections back to baseline India configuration."
      },
      ...JSON.parse(JSON.stringify(SEED_AUDIT_LOGS))
    ];
    this.reconciliations = JSON.parse(JSON.stringify(SEED_RECONCILIATIONS));
    this.reports = JSON.parse(JSON.stringify(SEED_REPORTS));
    this.notifications = JSON.parse(JSON.stringify(SEED_NOTIFICATIONS));
  }
}
