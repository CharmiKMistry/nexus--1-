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
  id: string; // "in", "us", "de", "gb", "au", "ca", "sg", "ae"
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

// --- Initial Seed Datasets ---

export const SEED_EMPLOYEES: EmployeeProfile[] = [
  { id: "EMP-1042", name: "Anna Weber", country: "Germany", department: "Engineering", title: "Principal Architect", salary: 8500, status: "Active", email: "anna.weber@nexus-corp.com", grade: "Grade 8", bankDetails: "DE89 3704 0044 0532 99", joiningDate: "2023-04-15" },
  { id: "EMP-2109", name: "Marcus Tan", country: "Singapore", department: "Product", title: "Product Lead", salary: 7800, status: "Active", email: "marcus.tan@nexus-corp.com", grade: "Grade 9", bankDetails: "DBS SG 021-392-482", joiningDate: "2022-09-01" },
  { id: "EMP-0098", name: "Sarah Jenkins", country: "United States", department: "Sales", title: "VP Global Sales", salary: 12500, status: "Active", email: "sarah.jenkins@nexus-corp.com", grade: "Grade 10", bankDetails: "CHASE US NY 4810-482", joiningDate: "2021-01-10" },
  { id: "EMP-3045", name: "Hiroshi Sato", country: "Japan", department: "Operations", title: "Director of Ops", salary: 11000, status: "Active", email: "hiroshi.sato@nexus-corp.com", grade: "Grade 7", bankDetails: "MUFG JP Tokyo 901-44", joiningDate: "2020-11-20" },
  { id: "EMP-1204", name: "Pierre Dubois", country: "France", department: "Marketing", title: "Senior Manager", salary: 6200, status: "Active", email: "pierre.dubois@nexus-corp.com", grade: "Grade 8", bankDetails: "BNP FR Paris 892-02", joiningDate: "2024-02-01" },
  { id: "EMP-4050", name: "John Doe", country: "United States", department: "Sales", title: "Sales Executive", salary: 5500, status: "Active", email: "john.doe@nexus-corp.com", grade: "Grade 7", bankDetails: "WFC US SF 9012-345", joiningDate: "2025-05-15" },
  { id: "EMP-5011", name: "Elena Rostova", country: "Germany", department: "Operations", title: "Operations Analyst", salary: 7000, status: "Active", email: "elena.rostova@nexus-corp.com", grade: "Grade 8", bankDetails: "DB DE Frankfurt 4820-22", joiningDate: "2024-10-01" },
  { id: "EMP-6022", name: "David Smith", country: "United Kingdom", department: "Engineering", title: "Lead Developer", salary: 8500, status: "Active", email: "david.smith@nexus-corp.com", grade: "Grade 9", bankDetails: "BARC GB London 9920-11", joiningDate: "2022-03-01" },
  { id: "EMP-7033", name: "Pierre Roy", country: "Canada", department: "Marketing", title: "Design Director", salary: 7500, status: "Active", email: "pierre.roy@nexus-corp.com", grade: "Grade 8", bankDetails: "TD CA Toronto 482-10", joiningDate: "2023-08-15" },
  { id: "EMP-8044", name: "Amit Patel", country: "India", department: "Support", title: "Support Manager", salary: 4500, status: "Active", email: "amit.patel@nexus-corp.com", grade: "Grade 7", bankDetails: "ICICI IN Mumbai 0910-22", joiningDate: "2021-06-15" },
  { id: "EMP-9055", name: "Zayed Al-Mansoori", country: "UAE", department: "Finance", title: "Finance Analyst", salary: 9500, status: "Active", email: "zayed.almansoori@nexus-corp.com", grade: "Grade 9", bankDetails: "ENBD AE Dubai 9012-99", joiningDate: "2025-01-05" }
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
    overtimeRules: "Double the normal rate of wages for hours worked beyond 9 hours in a day or 48 hours in a week.",
    holidayRules: "3 National Holidays (Republic Day, Independence Day, Gandhi Jayanti) + statutory regional festival holidays.",
    taxRules: "New Tax Regime slab rates from 0% to 30%. Provident Fund (EPF) at 12% employee and employer contribution.",
    approvalWorkflow: ["HR Specialist", "Finance Controller", "Payroll Manager"],
    validationRules: ["Valid Permanent Account Number (PAN)", "Mandatory EPF enrollment if basic > ₹15,000", "No negative overtime hours"],
    exchangeRateUSD: 83.45
  },
  {
    id: "us",
    name: "United States",
    flag: "🇺🇸",
    currency: "USD ($)",
    timezone: "EST/PST (UTC-5/UTC-8)",
    payrollFrequency: "Semi-Monthly",
    workingHours: 40,
    overtimeRules: "FLSA rules require 1.5x regular rate for non-exempt employees working above 40 hours in a standard workweek.",
    holidayRules: "11 Federal Public Holidays. Paid time off is determined by employee handbook/corporate agreement.",
    taxRules: "Federal income tax withholding (10-37%) + State taxes + FICA (Social Security 6.2%, Medicare 1.45%).",
    approvalWorkflow: ["Sales VP/HRBP", "US Finance Controller", "US Payroll Admin", "Director of HR Operations"],
    validationRules: ["Valid SSN format (9 digits)", "Non-exempt overtime validation against FLSA", "Salary cannot be lower than Federal/State Minimum Wage"],
    exchangeRateUSD: 1.0
  },
  {
    id: "de",
    name: "Germany",
    flag: "🇩🇪",
    currency: "EUR (€)",
    timezone: "CET (UTC+1)",
    payrollFrequency: "Monthly",
    workingHours: 40,
    overtimeRules: "Arbeitszeitgesetz restricts maximum daily work hours to 10. Overtime can be compensated with TOIL or custom premium hourly rates.",
    holidayRules: "9 standard Federal Holidays + regional holidays depending on the operation's state (Bavaria, Berlin, etc.).",
    taxRules: "Progressive wage tax (14% to 45%) + Solidarity surcharge. High statutory social insurances split 50/50.",
    approvalWorkflow: ["Germany HR Analyst", "Germany Compliance Officer", "Global Payroll Director"],
    validationRules: ["Rest period between shifts must exceed 11 consecutive hours", "Max 10 hours daily limit violation check", "Invalid Tax ID format"],
    exchangeRateUSD: 0.92
  },
  {
    id: "gb",
    name: "United Kingdom",
    flag: "🇬🇧",
    currency: "GBP (£)",
    timezone: "GMT/BST (UTC+0)",
    payrollFrequency: "Monthly",
    workingHours: 37.5,
    overtimeRules: "No statutory overtime rate limit, but average weekly hours must comply with the 48-hour Working Time Regulations.",
    holidayRules: "8 standard Bank Holidays annually + statutory minimum 28 days paid leave (including bank holidays).",
    taxRules: "PAYE taxation brackets (0%, 20%, 40%, 45%) + National Insurance contributions (NICs) for both employee and employer.",
    approvalWorkflow: ["UK Payroll Specialist", "UK Financial Director", "Global Payroll Director"],
    validationRules: ["Valid National Insurance Number (NINO)", "Weekly hours below 48h working directive unless opt-out signed", "Pension enrollment (NEST) opt-in flag validation"],
    exchangeRateUSD: 0.79
  },
  {
    id: "au",
    name: "Australia",
    flag: "🇦🇺",
    currency: "AUD ($)",
    timezone: "AEST (UTC+10)",
    payrollFrequency: "Monthly",
    workingHours: 38,
    overtimeRules: "Governed by Modern Awards. Typically 1.5x for first 2 hours, 2x thereafter, and penalty rates for weekend overtime.",
    holidayRules: "7 National Public Holidays + state-specific holidays. Minimum 4 weeks annual leave.",
    taxRules: "Pay-As-You-Go (PAYG) progressive tax scales + 11.5% Superannuation Guarantee (mandatory employer contribution).",
    approvalWorkflow: ["ANZ HR Admin", "ANZ Finance Lead", "Global Payroll Auditor"],
    validationRules: ["Valid 11-digit Tax File Number (TFN)", "Superannuation Fund registration code validation", "Modern Award pay rates parity check"],
    exchangeRateUSD: 1.51
  },
  {
    id: "ca",
    name: "Canada",
    flag: "🇨🇦",
    currency: "CAD ($)",
    timezone: "EST/PST (UTC-5/UTC-8)",
    payrollFrequency: "Semi-Monthly",
    workingHours: 40,
    overtimeRules: "1.5x regular wage rate for hours worked beyond 8 hours a day or 44 hours a week in most provinces.",
    holidayRules: "9 nationwide statutory public holidays + provincial holidays (e.g. Family Day, Thanksgiving).",
    taxRules: "Combined Federal and Provincial income taxes + Canada Pension Plan (CPP) + Employment Insurance (EI).",
    approvalWorkflow: ["Canada Payroll Specialist", "Canada Finance Controller", "Global Operations VP"],
    validationRules: ["Valid 9-digit Social Insurance Number (SIN)", "Provincial tax code validation", "Overtime threshold of 44h standard audit"],
    exchangeRateUSD: 1.37
  },
  {
    id: "sg",
    name: "Singapore",
    flag: "🇸🇬",
    currency: "SGD (S$)",
    timezone: "SGT (UTC+8)",
    payrollFrequency: "Monthly",
    workingHours: 44,
    overtimeRules: "1.5x hourly rate for hours worked beyond 44 hours per week for non-exempt workers under the Employment Act.",
    holidayRules: "11 Gazetted Public Holidays + minimum 7 to 14 days annual leave based on service tenure.",
    taxRules: "Progressive tax rate (0% to 22%). Central Provident Fund (CPF) employer up to 17%, employee up to 20% on wages capped at S$6,800/mo.",
    approvalWorkflow: ["Singapore HR Partner", "Singapore Payroll Specialist", "Country Admin Manager"],
    validationRules: ["CPF contribution rate compliance check", "Workday age validation against CPF rules", "Prereq NRIC/FIN identification validation"],
    exchangeRateUSD: 1.35
  },
  {
    id: "ae",
    name: "UAE",
    flag: "🇦🇪",
    currency: "AED (د.إ)",
    timezone: "GST (UTC+4)",
    payrollFrequency: "Monthly",
    workingHours: 48,
    overtimeRules: "Standard 1.25x premium for overtime, scaling to 1.5x if overtime occurs between 9:00 PM and 4:00 AM.",
    holidayRules: "Official UAE public holidays (Eid Al Fitr, Eid Al Adha, National Day, etc.) + 30 calendar days annual leave.",
    taxRules: "0% Personal Income Tax. Pension contribution applies ONLY to UAE Nationals (GPSSA). Wage Protection System (WPS) mandated.",
    approvalWorkflow: ["UAE Payroll Lead", "Middle East Finance Director", "WPS Submissions Auditor"],
    validationRules: ["WPS compliant Salary File (SIF) generation", "GPSSA pension validation for citizens", "Non-citizen End-of-Service gratuity provision tracker"],
    exchangeRateUSD: 3.67
  }
];

export const SEED_EXCHANGE_RATES: ExchangeRateHistory[] = [
  { id: "ex_usd", currencyCode: "USD", rateToUSD: 1.0, lastUpdated: "2026-07-06 09:00", history: [{ date: "2026-07-02", rate: 1.0 }, { date: "2026-07-06", rate: 1.0 }] },
  { id: "ex_eur", currencyCode: "EUR", rateToUSD: 0.92, lastUpdated: "2026-07-06 09:00", history: [{ date: "2026-07-02", rate: 0.915 }, { date: "2026-07-06", rate: 0.92 }] },
  { id: "ex_inr", currencyCode: "INR", rateToUSD: 83.45, lastUpdated: "2026-07-06 09:00", history: [{ date: "2026-07-02", rate: 83.52 }, { date: "2026-07-06", rate: 83.45 }] },
  { id: "ex_gbp", currencyCode: "GBP", rateToUSD: 0.79, lastUpdated: "2026-07-06 09:00", history: [{ date: "2026-07-02", rate: 0.788 }, { date: "2026-07-06", rate: 0.79 }] },
  { id: "ex_aud", currencyCode: "AUD", rateToUSD: 1.51, lastUpdated: "2026-07-06 09:00", history: [{ date: "2026-07-02", rate: 1.518 }, { date: "2026-07-06", rate: 1.51 }] },
  { id: "ex_cad", currencyCode: "CAD", rateToUSD: 1.37, lastUpdated: "2026-07-06 09:00", history: [{ date: "2026-07-02", rate: 1.368 }, { date: "2026-07-06", rate: 1.37 }] },
  { id: "ex_sg_curr", currencyCode: "SGD", rateToUSD: 1.35, lastUpdated: "2026-07-06 09:00", history: [{ date: "2026-07-02", rate: 1.347 }, { date: "2026-07-06", rate: 1.35 }] },
  { id: "ex_aed", currencyCode: "AED", rateToUSD: 3.67, lastUpdated: "2026-07-06 09:00", history: [{ date: "2026-07-02", rate: 3.67 }, { date: "2026-07-06", rate: 3.67 }] }
];

// Seed 9 sample events corresponding to the 9 types
export const SEED_PAYROLL_EVENTS: PayrollEvent[] = [
  {
    id: "evt-001",
    employeeId: "EMP-1042",
    employeeName: "Anna Weber",
    country: "Germany",
    type: "Overtime",
    status: "AI Validated",
    timestamp: "2026-07-06 03:15",
    comments: "German Overtime Ingested via Excel Import.",
    supportingDocs: "Munich_Overtime_June2026.csv",
    workflowStep: "Compliance Officer",
    slaDays: 2,
    timeline: [
      { step: "Draft", status: "completed", date: "2026-07-05 10:00", user: "Anna Weber" },
      { step: "Uploaded", status: "completed", date: "2026-07-06 03:15", user: "Ronak Surve" },
      { step: "AI Validated", status: "active", date: "2026-07-06 03:16", user: "NEXUS Core Agent" }
    ]
  },
  {
    id: "evt-002",
    employeeId: "EMP-2109",
    employeeName: "Marcus Tan",
    country: "Singapore",
    type: "Variable Pay",
    status: "Manager Approved",
    timestamp: "2026-07-05 14:22",
    comments: "Q2 sales performance discretionary bonus payout.",
    supportingDocs: "SG_Product_Bonuses.xlsx",
    workflowStep: "HR Partner",
    slaDays: 3,
    timeline: [
      { step: "Uploaded", status: "completed", date: "2026-07-05 14:22", user: "Elena Müller" },
      { step: "AI Validated", status: "completed", date: "2026-07-05 14:25", user: "NEXUS Core Agent" },
      { step: "Manager Approved", status: "active", date: "2026-07-05 16:30", user: "Kenji Sato", comments: "Performance checks verified, approved." }
    ]
  },
  {
    id: "evt-003",
    employeeId: "EMP-0098",
    employeeName: "Sarah Jenkins",
    country: "United States",
    type: "Sales Award",
    status: "HR Approved",
    timestamp: "2026-07-04 09:40",
    comments: "Sales VP Award closed-won quota incentive.",
    supportingDocs: "US_SalesAwards_Q2.xlsx",
    workflowStep: "Payroll Admin",
    slaDays: 1,
    timeline: [
      { step: "Uploaded", status: "completed", date: "2026-07-04 09:40", user: "Marcus Tan" },
      { step: "AI Validated", status: "completed", date: "2026-07-04 09:45", user: "NEXUS Core Agent" },
      { step: "Manager Approved", status: "completed", date: "2026-07-04 11:15", user: "Marcus Tan" },
      { step: "HR Approved", status: "active", date: "2026-07-05 10:20", user: "Sarah Jenkins" }
    ]
  },
  {
    id: "evt-004",
    employeeId: "EMP-4050",
    employeeName: "John Doe",
    country: "United States",
    type: "New Joiner",
    status: "Draft",
    timestamp: "2026-07-06 09:00",
    comments: "New onboarding registration input from Workday.",
    supportingDocs: "Onboarding_US_July.xlsx",
    workflowStep: "HR Specialist",
    slaDays: 5,
    timeline: [
      { step: "Draft", status: "active", date: "2026-07-06 09:00", user: "HR Onboarding System" }
    ]
  },
  {
    id: "evt-005",
    employeeId: "EMP-3045",
    employeeName: "Hiroshi Sato",
    country: "Japan",
    type: "Salary Change",
    status: "Uploaded",
    timestamp: "2026-07-06 08:30",
    comments: "Base adjustment aligning with regional merit band shift.",
    supportingDocs: "Base_Adjustment_JP_July.pdf",
    workflowStep: "Manager Approval",
    slaDays: 3,
    timeline: [
      { step: "Draft", status: "completed", date: "2026-07-05 17:00", user: "Hiroshi Sato" },
      { step: "Uploaded", status: "active", date: "2026-07-06 08:30", user: "Hiroshi Sato" }
    ]
  },
  {
    id: "evt-006",
    employeeId: "EMP-5011",
    employeeName: "Elena Rostova",
    country: "Germany",
    type: "Promotion",
    status: "AI Validated",
    timestamp: "2026-07-05 11:20",
    comments: "Promoted to Lead Analyst, change of base salary & grade scale.",
    supportingDocs: "Promotion_Elena_R_DE.pdf",
    workflowStep: "Finance Auditor",
    slaDays: 4,
    timeline: [
      { step: "Uploaded", status: "completed", date: "2026-07-05 11:20", user: "Germany HR Manager" },
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
  },
  {
    id: "evt-008",
    employeeId: "EMP-1204",
    employeeName: "Pierre Dubois",
    country: "France",
    type: "Retention Pay",
    status: "Rejected",
    timestamp: "2026-07-01 10:15",
    comments: "Loyalty retention payout requested by department.",
    supportingDocs: "France_Retention_Dubois.docx",
    workflowStep: "HR Specialist",
    slaDays: 0,
    timeline: [
      { step: "Uploaded", status: "completed", date: "2026-07-01 10:15", user: "Pierre Dubois" },
      { step: "AI Validated", status: "completed", date: "2026-07-01 10:18", user: "NEXUS Core Agent" },
      { step: "Manager Approved", status: "completed", date: "2026-07-01 14:00", user: "Pierre Dubois" },
      { step: "HR Approved", status: "rejected", date: "2026-07-02 11:30", user: "France HR Lead", comments: "Exceeds standard 40% base allowance threshold. Request denied." }
    ]
  },
  {
    id: "evt-009",
    employeeId: "EMP-6022",
    employeeName: "David Smith",
    country: "United Kingdom",
    type: "Resignation",
    status: "Uploaded",
    timestamp: "2026-07-06 09:15",
    comments: "Terminal resignation payout and notice period calculation.",
    supportingDocs: "Resignation_David_S_UK.pdf",
    workflowStep: "Reporting Manager",
    slaDays: 5,
    timeline: [
      { step: "Draft", status: "completed", date: "2026-07-05 18:00", user: "David Smith" },
      { step: "Uploaded", status: "active", date: "2026-07-06 09:15", user: "David Smith" }
    ]
  }
];

export const SEED_NEW_JOINERS: NewJoinerEvent[] = [
  { id: "evt-004", employeeId: "EMP-4050", name: "John Doe", country: "United States", joiningDate: "2025-05-15", grade: "Grade 7", baseSalary: 5500, email: "john.doe@nexus-corp.com" }
];

export const SEED_SALARY_CHANGES: SalaryChangeEvent[] = [
  { id: "evt-005", employeeId: "EMP-3045", employeeName: "Hiroshi Sato", oldSalary: 10500, newSalary: 11000, effectiveDate: "2026-07-01", reason: "Annual Corporate Merit Adjustment" }
];

export const SEED_PROMOTIONS: PromotionEvent[] = [
  { id: "evt-006", employeeId: "EMP-5011", employeeName: "Elena Rostova", oldGrade: "Grade 7", newGrade: "Grade 8", newDesignation: "Senior Operations Specialist", effectiveDate: "2026-07-01" }
];

export const SEED_VARIABLE_PAY: VariablePayEvent[] = [
  { id: "evt-002", employeeId: "EMP-2109", employeeName: "Marcus Tan", amount: 2500, performanceRating: 4.5, fiscalQuarter: "Q2 2026" }
];

export const SEED_RETENTION_PAY: RetentionPayEvent[] = [
  { id: "evt-008", employeeId: "EMP-1204", employeeName: "Pierre Dubois", amount: 4500, retentionPeriodMonths: 24, lockInDate: "2026-07-01" }
];

export const SEED_RECOVERIES: RecoveryEvent[] = [
  { id: "evt-007", employeeId: "EMP-8044", employeeName: "Amit Patel", recoveryAmount: 1200, reason: "Clawback of duplicate travel allowance disbursement", installmentsCount: 3 }
];

export const SEED_SALES_AWARDS: SalesAwardEvent[] = [
  { id: "evt-003", employeeId: "EMP-0098", employeeName: "Sarah Jenkins", awardAmount: 8500, quarter: "Q2 2026", sourceCRM: "Salesforce CRM" }
];

export const SEED_OVERTIME: OvertimeEvent[] = [
  { id: "evt-001", employeeId: "EMP-1042", employeeName: "Anna Weber", overtimeHours: 12, hourlyRate: 45, otDate: "2026-07-02" }
];

export const SEED_RESIGNATIONS: ResignationEvent[] = [
  { id: "evt-009", employeeId: "EMP-6022", employeeName: "David Smith", resignationDate: "2026-07-01", lastWorkingDate: "2026-08-15", leaveEncashmentDays: 14 }
];

export const SEED_VALIDATION_LOGS: ValidationLog[] = [
  {
    id: "val-1",
    employeeId: "EMP-1042",
    employeeName: "Anna Weber",
    country: "Germany",
    issueType: "Overtime Violations",
    severity: "High",
    confidenceScore: 98,
    explanation: "Worked 12.0 hours in a single shift, exceeding the 10-hour daily threshold mandated by the Germany Working Time Act (Arbeitszeitgesetz).",
    recommendedResolution: "Convert excess 2 hours into TOIL (Time-Off-In-Lieu) balance and issue a formal compliance bypass log.",
    status: "Pending"
  },
  {
    id: "val-2",
    employeeId: "EMP-2109",
    employeeName: "Marcus Tan",
    country: "Singapore",
    issueType: "CPF Contribution Mismatch",
    severity: "Medium",
    confidenceScore: 95,
    explanation: "HRMS records employee age as 54, triggering 20% employee CPF rate. Active payroll run calculated CPF at 15% based on stale Workday age bracket.",
    recommendedResolution: "Apply retroactive adjustment S$ 250.00 to align payroll run with the true HRMS age status.",
    status: "Pending"
  },
  {
    id: "val-3",
    employeeId: "EMP-0098",
    employeeName: "Sarah Jenkins",
    country: "United States",
    issueType: "Base Salary Variance",
    severity: "High",
    confidenceScore: 92,
    explanation: "Ingested base salary of $12,500.00 for the month is 25% higher than the HRMS active contract base salary of $10,000.00.",
    recommendedResolution: "Reject the ingested timesheet rate and revert to the contract base salary, or request Compensation Team approval.",
    status: "Pending"
  },
  {
    id: "val-4",
    employeeId: "EMP-6022",
    employeeName: "David Smith",
    country: "United Kingdom",
    issueType: "Missing Mandatory Field",
    severity: "High",
    confidenceScore: 100,
    explanation: "LeaveEncashmentDays was designated as empty or null in the resignation payload, which is required for UK statutory terminal payout auditing.",
    recommendedResolution: "Enter actual statutory outstanding leave balance from Workday HRMS logs (Detected 14 days).",
    status: "Pending"
  }
];

export const SEED_AUDIT_LOGS: AuditLog[] = [
  { id: "aud-001", timestamp: "2026-07-06T01:10:00Z", user: "Ronak Surve (Super Admin)", role: "Super Admin", action: "System Ingestion Initiated", details: "Ingested 12 timecards and overtime records via Smart Excel Upload." },
  { id: "aud-002", timestamp: "2026-07-06T02:30:15Z", user: "NEXUS Agent Layer", role: "AI Validation Agent", action: "Automated scan performed", details: "Scanned 1420 files, identified 5 validation exceptions" },
  { id: "aud-003", timestamp: "2026-07-06T03:00:10Z", user: "Elena Müller (Country Admin)", role: "Country Admin", action: "Rule Overtime Override updated", details: "Overtime grace limit adjusted for Berlin operations" }
];

export const SEED_RECONCILIATIONS: ReconciliationResult[] = [
  {
    id: "rec-1",
    employeeId: "EMP-1042",
    name: "Anna Weber",
    source: "Timesheets (168h)",
    target: "HRMS (160h)",
    discrepancy: "+8.0 hrs Variance",
    type: "Overtime Reconciliation",
    confidence: 94,
    aiRecommendation: "Authorize 8 hours overtime pay. Verified against automatic card badge-in security logs showing entry at 08:02 and exit at 18:35.",
    status: "Pending"
  },
  {
    id: "rec-2",
    employeeId: "EMP-2109",
    name: "Marcus Tan",
    source: "Claims (S$ 420.00)",
    target: "Policy Rule (S$ 300.00 Max)",
    discrepancy: "S$ 120.00 Policy Overrun",
    type: "Expense Inconsistency",
    confidence: 89,
    aiRecommendation: "Approve S$ 300.00 standard limit and route S$ 120.00 exception for Executive Sign-off due to offsite client dinner.",
    status: "Pending"
  },
  {
    id: "rec-3",
    employeeId: "EMP-3045",
    name: "Hiroshi Sato",
    source: "Salary Rev ($11,000.00)",
    target: "Employee Master ($10,500.00)",
    discrepancy: "+$500.00 Merit Variance",
    type: "Salary Revision vs Employee Master",
    confidence: 97,
    aiRecommendation: "Approve the $11,000.00. Verified against signed contractual promo document (Ref: H-JP-7392).",
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
  { id: "rep-001", name: "Global_Payroll_Summary_July2026.pdf", type: "Payroll Summary", generatedAt: "2026-07-06 08:30", size: "1.4 MB", format: "PDF", downloadUrl: "#", status: "Ready" },
  { id: "rep-002", name: "Salary_Revision_Report_Q2.xlsx", type: "Salary Revision Report", generatedAt: "2026-07-05 11:00", size: "850 KB", format: "Excel", downloadUrl: "#", status: "Ready" },
  { id: "rep-003", name: "Overtime_Audit_Detailed_Germany.csv", type: "Overtime Report", generatedAt: "2026-07-06 03:20", size: "420 KB", format: "CSV", downloadUrl: "#", status: "Ready" }
];

export const SEED_NOTIFICATIONS: NotificationItem[] = [
  { id: "notif-1", title: "Compliance Breach Flagged", message: "Germany daily maximum limit exceeded (12 hours) for Employee Anna Weber.", type: "error", timestamp: "03:15 UTC", read: false },
  { id: "notif-2", title: "CPF Inconsistency Aligned", message: "AI suggested retro CPF adjustment of S$ 250.00 pending audit approval.", type: "warning", timestamp: "03:16 UTC", read: false },
  { id: "notif-3", title: "SuccessFactors Sync", message: "Successfully ingested 240 sales records from SuccessFactors pipeline.", type: "success", timestamp: "Yesterday", read: true }
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

  // Restores all collections to base seed data instantly (Demo Reset capability!)
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
        details: "Wiped all custom data entries and re-seeded 19 collections back to baseline MongoDB configuration."
      },
      ...JSON.parse(JSON.stringify(SEED_AUDIT_LOGS))
    ];
    this.reconciliations = JSON.parse(JSON.stringify(SEED_RECONCILIATIONS));
    this.reports = JSON.parse(JSON.stringify(SEED_REPORTS));
    this.notifications = JSON.parse(JSON.stringify(SEED_NOTIFICATIONS));
  }
}
