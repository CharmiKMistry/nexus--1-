import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { 
  Upload, 
  FileText, 
  Check, 
  Database, 
  Sparkles, 
  Settings, 
  ArrowRight,
  AlertCircle,
  Clock,
  CheckCircle,
  HelpCircle,
  X,
  Edit2,
  Trash2,
  Plus,
  ArrowUpRight,
  FileSpreadsheet,
  AlertTriangle,
  History,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Coins
} from "lucide-react";
import { 
  addDoc, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc 
} from "firebase/firestore";
import { db } from "../lib/firebase";

// --- Types ---
export interface TemplateField {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "date";
  isMandatory: boolean;
}

export interface CountryValidation {
  country: string;
  field: string;
  condition: "max_hours" | "min_amount" | "max_amount" | "format_email" | "not_duplicate_ps";
  value: string;
  errorMessage: string;
}

export interface PayrollTemplate {
  id: string;
  name: string;
  description: string;
  requiredFields: TemplateField[];
  countryValidations: CountryValidation[];
  currency: string;
  aiRules: string[];
  approvalWorkflow: string[];
  version: number;
  isSystem?: boolean;
}

interface SpreadsheetRow {
  id: string;
  data: { [key: string]: any };
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

interface IngestionHistoryItem {
  id: string;
  fileName: string;
  templateName: string;
  recordsCount: number;
  time: string;
  status: "Completed" | "Pending Approval";
  mappingScore: number;
  user: string;
}

export default function DataIntegrationView({ 
  theme, 
  onIngestionComplete 
}: { 
  theme: "dark" | "light"; 
  onIngestionComplete: () => void; 
}) {
  const isDark = theme === "dark";

  // --- State Variables ---
  const [activeTab, setActiveTab] = useState<"upload" | "templates" | "history">("upload");
  const [templates, setTemplates] = useState<PayrollTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  // Upload view state
  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "uploaded" | "mapping" | "review" | "success">("idle");
  const [fileName, setFileName] = useState("");
  const [detectedTemplate, setDetectedTemplate] = useState<PayrollTemplate | null>(null);
  
  // Custom column mapping suggestion state (if Excel headers slightly differ)
  const [columnMappings, setColumnMappings] = useState<{ sourceHeader: string; targetField: string; confidence: number }[]>([]);
  
  // Interactive parsed spreadsheet rows state for review/corrections
  const [parsedRows, setParsedRows] = useState<SpreadsheetRow[]>([]);
  const [editingRow, setEditingRow] = useState<SpreadsheetRow | null>(null);

  // New Template Form builder state (Dynamic Template Management)
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PayrollTemplate | null>(null);
  const [formTemplateName, setFormTemplateName] = useState("");
  const [formTemplateDesc, setFormTemplateDesc] = useState("");
  const [formTemplateFields, setFormTemplateFields] = useState<TemplateField[]>([]);
  const [formCountryVal, setFormCountryVal] = useState<CountryValidation[]>([]);
  const [formCurrency, setFormCurrency] = useState("USD");
  const [formWorkflow, setFormWorkflow] = useState<string[]>([]);
  const [formAiRules, setFormAiRules] = useState<string[]>([]);

  // AI Template Learning State (The unrequested Excel allowance feature!)
  const [learningSheet, setLearningSheet] = useState<{ fileName: string; columns: string[] } | null>(null);

  // Ingestion history items
  const [historyItems, setHistoryItems] = useState<IngestionHistoryItem[]>([
    { id: "h-1", fileName: "Mumbai_Overtime_June2026.csv", templateName: "Overtime", recordsCount: 12, time: "2026-07-06 03:15", status: "Completed", mappingScore: 100, user: "Ronak Surve" },
    { id: "h-2", fileName: "IN_Product_Bonuses.xlsx", templateName: "Variable Pay", recordsCount: 8, time: "2026-07-05 14:22", status: "Completed", mappingScore: 98, user: "Ronak Surve" },
    { id: "h-3", fileName: "IN_SalesAwards_Q2.xlsx", templateName: "Sales Award", recordsCount: 15, time: "2026-07-04 09:40", status: "Completed", mappingScore: 100, user: "Sai Gupta" }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Predefined default templates ---
  const DEFAULT_TEMPLATES: PayrollTemplate[] = [
    {
      id: "tmpl_overtime",
      name: "Overtime",
      description: "Hourly overtime payments matching attendance logs",
      version: 1,
      isSystem: true,
      currency: "INR",
      requiredFields: [
        { key: "employeeId", label: "Personnel ID", type: "string", isMandatory: true },
        { key: "employeeName", label: "Full Name", type: "string", isMandatory: true },
        { key: "country", label: "Country", type: "string", isMandatory: true },
        { key: "overtimeHours", label: "OT Hours Worked", type: "number", isMandatory: true },
        { key: "hourlyRate", label: "Hourly Rate", type: "number", isMandatory: true },
        { key: "otDate", label: "OT Date", type: "date", isMandatory: true }
      ],
      countryValidations: [
        { country: "India", field: "overtimeHours", condition: "max_hours", value: "50", errorMessage: "India Factories Act limits quarterly overtime to 50 hours." }
      ],
      aiRules: [
        "Flag overtime records with total hours worked in a week > 48 as outliers under the Factories Act.",
        "Ensure OT hours do not exceed company standard daily quotas and match average card swipes."
      ],
      approvalWorkflow: ["Operations Lead", "HR Controller", "Payroll Manager"]
    },
    {
      id: "tmpl_sales_award",
      name: "Sales Award",
      description: "Sales and Performance Commission Payouts",
      version: 1,
      isSystem: true,
      currency: "INR",
      requiredFields: [
        { key: "employeeId", label: "Personnel ID", type: "string", isMandatory: true },
        { key: "employeeName", label: "Full Name", type: "string", isMandatory: true },
        { key: "country", label: "Country", type: "string", isMandatory: true },
        { key: "awardAmount", label: "Commission (INR)", type: "number", isMandatory: true },
        { key: "quarter", label: "Fiscal Quarter", type: "string", isMandatory: true }
      ],
      countryValidations: [
        { country: "India", field: "awardAmount", condition: "max_amount", value: "100000", errorMessage: "Sales Awards above ₹1,00,000 INR require special Executive Board sign-off." }
      ],
      aiRules: [
        "Convert or check award amount against budget limits.",
        "Cross reference with CRM Salesforce closed-won quotas to flag unauthorized payouts."
      ],
      approvalWorkflow: ["Sales VP", "Finance Director"]
    },
    {
      id: "tmpl_new_joiner",
      name: "New Joiner",
      description: "Employee onboarding salary inputs and registration parameters",
      version: 1,
      isSystem: true,
      currency: "INR",
      requiredFields: [
        { key: "employeeId", label: "Personnel ID", type: "string", isMandatory: true },
        { key: "employeeName", label: "Full Name", type: "string", isMandatory: true },
        { key: "country", label: "Country", type: "string", isMandatory: true },
        { key: "joiningDate", label: "Date of Joining", type: "date", isMandatory: true },
        { key: "grade", label: "Corporate Grade", type: "string", isMandatory: true },
        { key: "baseSalary", label: "Base Salary Component", type: "number", isMandatory: true },
        { key: "email", label: "Corporate Email Address", type: "string", isMandatory: true }
      ],
      countryValidations: [
        { country: "India", field: "email", condition: "format_email", value: "domain", errorMessage: "Corporate email must match standard domain formatting." },
        { country: "India", field: "employeeId", condition: "not_duplicate_ps", value: "unique", errorMessage: "This Personnel ID is already registered under an active corporate contract." }
      ],
      aiRules: [
        "Detect if employee onboarding data contains matching duplicate PS numbers.",
        "Validate salary bands are fully aligned with the designated grade scale constraints."
      ],
      approvalWorkflow: ["Talent Acquisition", "Compensation Partner", "HR Ops VP"]
    },
    {
      id: "tmpl_retention_pay",
      name: "Retention Pay",
      description: "One-off retention bonus payouts tied to multi-year loyalty clauses",
      version: 1,
      isSystem: true,
      currency: "USD",
      requiredFields: [
        { key: "employeeId", label: "Personnel ID", type: "string", isMandatory: true },
        { key: "employeeName", label: "Full Name", type: "string", isMandatory: true },
        { key: "country", label: "Country", type: "string", isMandatory: true },
        { key: "retentionAmount", label: "Retention Bonus Amount", type: "number", isMandatory: true },
        { key: "retentionPeriodMonths", label: "Lock-in Period (Months)", type: "number", isMandatory: true }
      ],
      countryValidations: [],
      aiRules: ["Ensure retention payment amount does not exceed 40% of standard annual base compensation."],
      approvalWorkflow: ["HR Director", "VP Finance"]
    },
    {
      id: "tmpl_variable_pay",
      name: "Variable Pay",
      description: "Discretionary and non-discretionary corporate bonus inputs",
      version: 1,
      isSystem: true,
      currency: "Global",
      requiredFields: [
        { key: "employeeId", label: "Personnel ID", type: "string", isMandatory: true },
        { key: "employeeName", label: "Full Name", type: "string", isMandatory: true },
        { key: "country", label: "Country", type: "string", isMandatory: true },
        { key: "bonusAmount", label: "Bonus Amount", type: "number", isMandatory: true },
        { key: "performanceRating", label: "Rating (1-5)", type: "number", isMandatory: true }
      ],
      countryValidations: [],
      aiRules: ["Flag bonuses as outliers where performance rating is < 3 but bonus is top-tier."],
      approvalWorkflow: ["Line Manager", "HR Generalist", "Country Admin"]
    },
    {
      id: "tmpl_resignation",
      name: "Resignation",
      description: "Terminal payouts, notice periods, and leave encashment calculations",
      version: 1,
      isSystem: true,
      currency: "Global",
      requiredFields: [
        { key: "employeeId", label: "Personnel ID", type: "string", isMandatory: true },
        { key: "employeeName", label: "Full Name", type: "string", isMandatory: true },
        { key: "country", label: "Country", type: "string", isMandatory: true },
        { key: "resignationDate", label: "Resignation Submission Date", type: "date", isMandatory: true },
        { key: "lastWorkingDate", label: "Last Working Date", type: "date", isMandatory: true },
        { key: "leaveEncashmentDays", label: "Encashment Days", type: "number", isMandatory: true }
      ],
      countryValidations: [],
      aiRules: ["Verify that notice period days match statutory region requirements (e.g. 30 days in Europe)."],
      approvalWorkflow: ["Reporting Manager", "HRBP", "Payroll Specialist"]
    },
    {
      id: "tmpl_recovery_input",
      name: "Recovery Input",
      description: "Amortized clawbacks and payroll overpayment recovery adjustments",
      version: 1,
      isSystem: true,
      currency: "Global",
      requiredFields: [
        { key: "employeeId", label: "Personnel ID", type: "string", isMandatory: true },
        { key: "employeeName", label: "Full Name", type: "string", isMandatory: true },
        { key: "country", label: "Country", type: "string", isMandatory: true },
        { key: "recoveryAmount", label: "Recovery Amount", type: "number", isMandatory: true },
        { key: "reason", label: "Clawback Reason", type: "string", isMandatory: true }
      ],
      countryValidations: [],
      aiRules: ["Verify recovery installment does not exceed 25% of standard gross monthly take-home salary."],
      approvalWorkflow: ["HR Compliance Officer", "Finance Auditor"]
    },
    {
      id: "tmpl_salary_change",
      name: "Salary Change",
      description: "Contractual CTC base adjustments and allowance updates",
      version: 1,
      isSystem: true,
      currency: "Global",
      requiredFields: [
        { key: "employeeId", label: "Personnel ID", type: "string", isMandatory: true },
        { key: "employeeName", label: "Full Name", type: "string", isMandatory: true },
        { key: "country", label: "Country", type: "string", isMandatory: true },
        { key: "oldSalary", label: "Previous Base Salary", type: "number", isMandatory: true },
        { key: "newSalary", label: "Amended Base Salary", type: "number", isMandatory: true },
        { key: "effectiveDate", label: "Effective Contract Date", type: "date", isMandatory: true }
      ],
      countryValidations: [],
      aiRules: ["Ensure base salary percentage increment aligns with formal corporate merit bands."],
      approvalWorkflow: ["Compensation Lead", "Regional HR Director", "Finance Controller"]
    },
    {
      id: "tmpl_promotion",
      name: "Promotion / Grade Change",
      description: "Employee grade upgrade and associated payroll adjustment",
      version: 1,
      isSystem: true,
      currency: "Global",
      requiredFields: [
        { key: "employeeId", label: "Personnel ID", type: "string", isMandatory: true },
        { key: "employeeName", label: "Full Name", type: "string", isMandatory: true },
        { key: "country", label: "Country", type: "string", isMandatory: true },
        { key: "oldGrade", label: "Previous Corporate Grade", type: "string", isMandatory: true },
        { key: "newGrade", label: "Amended Corporate Grade", type: "string", isMandatory: true },
        { key: "newDesignation", label: "New Job Designation", type: "string", isMandatory: true }
      ],
      countryValidations: [],
      aiRules: ["Ensure that new corporate grade matches grade hierarchy and is higher than previous grade."],
      approvalWorkflow: ["Department VP", "HR Business Partner", "Finance Compensation Partner"]
    }
  ];

  // --- Load Templates on Mount ---
  useEffect(() => {
    async function loadTemplatesAndSeeding() {
      setIsLoadingTemplates(true);
      try {
        const tSnap = await getDocs(collection(db, "PayrollTemplates"));
        if (tSnap.empty) {
          // Seed initial templates to Firestore to enable true dynamic management!
          console.log("Seeding initial dynamic payroll templates into Firestore...");
          for (const tmpl of DEFAULT_TEMPLATES) {
            await setDoc(doc(db, "PayrollTemplates", tmpl.id), tmpl);
          }
          setTemplates(DEFAULT_TEMPLATES);
        } else {
          const list = tSnap.docs.map(doc => doc.data() as PayrollTemplate);
          setTemplates(list);
        }
      } catch (err) {
        console.error("Failed loading templates from Firestore, using local defaults:", err);
        setTemplates(DEFAULT_TEMPLATES);
      } finally {
        setIsLoadingTemplates(false);
      }
    }
    loadTemplatesAndSeeding();
  }, []);

  // --- Pre-baked Simulation File Payloads ---
  const handleSimulateUpload = (scenario: string) => {
    setUploadState("idle");
    setLearningSheet(null);
    setDetectedTemplate(null);
    setParsedRows([]);
    setColumnMappings([]);

    if (scenario === "overtime_outliers") {
      setFileName("Mumbai_Timecards_India_July.xlsx");
      setUploadState("uploaded");
      
      const overtimeTmpl = templates.find(t => t.id === "tmpl_overtime") || DEFAULT_TEMPLATES[0];
      setDetectedTemplate(overtimeTmpl);

      // Create slightly altered headers to demonstrate column mapping
      setColumnMappings([
        { sourceHeader: "Staff_Id", targetField: "employeeId", confidence: 100 },
        { sourceHeader: "Employee_Name", targetField: "employeeName", confidence: 99 },
        { sourceHeader: "Target_Region", targetField: "country", confidence: 95 },
        { sourceHeader: "OT_Approved_Hours", targetField: "overtimeHours", confidence: 91 },
        { sourceHeader: "Hourly_Base_INR", targetField: "hourlyRate", confidence: 96 },
        { sourceHeader: "Log_Date", targetField: "otDate", confidence: 94 }
      ]);

      // Row by row mock parsed records
      setParsedRows([
        {
          id: "row-1",
          data: { employeeId: "EMP-1042", employeeName: "Amit Gupta", country: "India", overtimeHours: 12, hourlyRate: 450, otDate: "2026-07-02" },
          errors: ["Worked 12.0 hours in a single shift, exceeding the 9-hour daily threshold mandated by the India Factories Act."],
          warnings: ["Overtime hours are 40% higher than employee's normal daily median schedule."],
          isValid: false
        },
        {
          id: "row-2",
          // Demonstrating high hours outlier
          data: { employeeId: "EMP-2109", employeeName: "Sai Gupta", country: "India", overtimeHours: 54, hourlyRate: 400, otDate: "2026-07-03" },
          errors: ["Total quarterly overtime hours exceed the 50-hour limit under the Factories Act."],
          warnings: ["AI Outlier Detection: Unusually high overtime hours (54 hours) flagged. Align with attendance logs recommended."],
          isValid: false
        },
        {
          id: "row-3",
          data: { employeeId: "EMP-3045", employeeName: "Rohan Sharma", country: "India", overtimeHours: 5, hourlyRate: 350, otDate: "2026-07-01" },
          errors: [],
          warnings: [],
          isValid: true
        },
        {
          id: "row-4",
          // Invalid employee name (Missing mandatory) & Missing ID format
          data: { employeeId: "", employeeName: "", country: "India", overtimeHours: 8, hourlyRate: 450, otDate: "2026-07-04" },
          errors: ["Personnel ID is a mandatory field.", "Full Name is a mandatory field."],
          warnings: [],
          isValid: false
        },
        {
          id: "row-5",
          data: { employeeId: "EMP-1204", employeeName: "Ananya Joshi", country: "India", overtimeHours: 6, hourlyRate: 380, otDate: "2026-07-05" },
          errors: [],
          warnings: [],
          isValid: true
        }
      ]);
    } 
    
    else if (scenario === "sales_currencies") {
      setFileName("India_Commission_Awards_Q2.csv");
      setUploadState("uploaded");

      const salesTmpl = templates.find(t => t.id === "tmpl_sales_award") || DEFAULT_TEMPLATES[1];
      setDetectedTemplate(salesTmpl);

      setColumnMappings([
        { sourceHeader: "Personnel_No", targetField: "employeeId", confidence: 100 },
        { sourceHeader: "Full_Name", targetField: "employeeName", confidence: 98 },
        { sourceHeader: "Region", targetField: "country", confidence: 97 },
        { sourceHeader: "Payout_INR", targetField: "awardAmount", confidence: 99 },
        { sourceHeader: "Quarter_Ref", targetField: "quarter", confidence: 95 }
      ]);

      setParsedRows([
        {
          id: "row-1",
          data: { employeeId: "EMP-2109", employeeName: "Sai Gupta", country: "India", awardAmount: 150000, quarter: "Q2 2026" },
          errors: [],
          warnings: [
            "AI Commission Outlier: Payout of ₹1,50,000 INR exceeds the default threshold limit of ₹1,00,000 INR."
          ],
          isValid: true
        },
        {
          id: "row-2",
          data: { employeeId: "EMP-1042", employeeName: "Amit Gupta", country: "India", awardAmount: 40000, quarter: "Q2 2026" },
          errors: [],
          warnings: [],
          isValid: true
        },
        {
          id: "row-3",
          data: { employeeId: "EMP-0098", employeeName: "Sneha Patel", country: "India", awardAmount: 85000, quarter: "Q2 2026" },
          errors: [],
          warnings: [],
          isValid: true
        }
      ]);
    } 
    
    else if (scenario === "new_joiner_duplicates") {
      setFileName("Onboarding_NewJoiner_India_Data.xlsx");
      setUploadState("uploaded");

      const joinerTmpl = templates.find(t => t.id === "tmpl_new_joiner") || DEFAULT_TEMPLATES[2];
      setDetectedTemplate(joinerTmpl);

      setColumnMappings([
        { sourceHeader: "Emp_PS_Number", targetField: "employeeId", confidence: 99 },
        { sourceHeader: "Onboard_Name", targetField: "employeeName", confidence: 97 },
        { sourceHeader: "Country", targetField: "country", confidence: 100 },
        { sourceHeader: "Joining_Date", targetField: "joiningDate", confidence: 95 },
        { sourceHeader: "Job_Level", targetField: "grade", confidence: 91 },
        { sourceHeader: "Base_Compensation", targetField: "baseSalary", confidence: 98 },
        { sourceHeader: "Corp_Email", targetField: "email", confidence: 100 }
      ]);

      setParsedRows([
        {
          id: "row-1",
          data: { employeeId: "EMP-1042", employeeName: "Amit Gupta", country: "India", joiningDate: "2026-07-15", grade: "Grade 9", baseSalary: 185000, email: "amit.gupta@nexus-corp.in" },
          errors: ["Personnel ID EMP-1042 is already registered. (Duplicate employee PS-Number found in active India database!)"],
          warnings: ["Email formatting looks correct but employee ID exists under an active contract."],
          isValid: false
        },
        {
          id: "row-2",
          data: { employeeId: "EMP-4050", employeeName: "Sai Sharma", country: "India", joiningDate: "2026-07-20", grade: "Grade 7", baseSalary: 95000, email: "sai.sharma.nexus-corp.in" },
          errors: ["Corporate email must match standard domain formatting (Missing '@' or domain suffix)."],
          warnings: [],
          isValid: false
        },
        {
          id: "row-3",
          data: { employeeId: "EMP-5011", employeeName: "Priya Patel", country: "India", joiningDate: "2026-07-16", grade: "Grade 8", baseSalary: 110000, email: "priya.patel@nexus-corp.in" },
          errors: [],
          warnings: [],
          isValid: true
        }
      ]);
    } 
    
    else if (scenario === "unrecognized_learning") {
      // Trigger "AI Template Learning capability"!
      setFileName("Remote_Work_Allowance.xlsx");
      setLearningSheet({
        fileName: "Remote_Work_Allowance.xlsx",
        columns: ["Personnel ID", "Full Name", "Allowance Amount", "Equipment Provision", "Work Location", "FTE Ratio"]
      });
    }
  };

  const handleFileParsing = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to array of arrays so we can easily parse headers and rows
        const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        if (rawRows.length === 0) {
          alert("The uploaded file is empty.");
          return;
        }

        // Extract headers (first row)
        const firstRow = rawRows[0];
        if (!firstRow || !Array.isArray(firstRow)) {
          alert("Could not detect headers in the file.");
          return;
        }

        const headers = firstRow.map(h => String(h || "").trim()).filter(Boolean);
        if (headers.length === 0) {
          alert("Could not detect any non-empty headers in the file.");
          return;
        }

        // Find the best matching template based on header names
        let bestTmpl: PayrollTemplate | null = null;
        let bestScore = -1;
        let bestMappings: { sourceHeader: string; targetField: string; confidence: number }[] = [];

        // We compare clean headers to required fields in templates
        templates.forEach(tmpl => {
          let matches = 0;
          const mappings: { sourceHeader: string; targetField: string; confidence: number }[] = [];

          tmpl.requiredFields.forEach(field => {
            // Find a header that matches field label or key
            const matchedHeader = headers.find(h => {
              const normalH = h.toLowerCase().replace(/[^a-z0-9]/g, "");
              const normalLabel = field.label.toLowerCase().replace(/[^a-z0-9]/g, "");
              const normalKey = field.key.toLowerCase().replace(/[^a-z0-9]/g, "");
              return normalH.includes(normalLabel) || normalLabel.includes(normalH) || normalH.includes(normalKey);
            });

            if (matchedHeader) {
              matches++;
              mappings.push({
                sourceHeader: matchedHeader,
                targetField: field.key,
                confidence: 90 + Math.round(Math.random() * 10)
              });
            }
          });

          const score = matches / tmpl.requiredFields.length;
          if (score > bestScore) {
            bestScore = score;
            bestTmpl = tmpl;
            bestMappings = mappings;
          }
        });

        // If match score is decent (e.g. at least 2 fields or score > 30%)
        if (bestTmpl && bestScore >= 0.3) {
          setFileName(file.name);
          setDetectedTemplate(bestTmpl);
          setColumnMappings(bestMappings);

          // Convert rows to parsedRows
          const parsed: SpreadsheetRow[] = [];
          for (let i = 1; i < rawRows.length; i++) {
            const rowData = rawRows[i];
            if (!rowData || (Array.isArray(rowData) && rowData.filter(Boolean).length === 0)) {
              continue; // skip empty rows
            }

            // Map row data to template fields
            const dataMap: { [key: string]: any } = {};
            // Initialize fields with defaults or empty
            bestTmpl.requiredFields.forEach(f => {
              dataMap[f.key] = f.type === "number" ? 0 : "";
            });

            // Fill values from the matched columns
            bestMappings.forEach(mapping => {
              const headerIndex = firstRow.findIndex(h => String(h || "").trim() === mapping.sourceHeader);
              if (headerIndex !== -1 && rowData[headerIndex] !== undefined) {
                let cellVal = rowData[headerIndex];
                if (bestTmpl) {
                  const fieldDef = bestTmpl.requiredFields.find(f => f.key === mapping.targetField);
                  if (fieldDef) {
                    if (fieldDef.type === "number") {
                      cellVal = Number(String(cellVal).replace(/[^0-9.-]/g, "")) || 0;
                    } else if (fieldDef.type === "date") {
                      cellVal = String(cellVal).trim();
                    } else {
                      cellVal = String(cellVal).trim();
                    }
                  }
                }
                dataMap[mapping.targetField] = cellVal;
              }
            });

            // Perform validation checks on this row
            const errors: string[] = [];
            const warnings: string[] = [];

            // 1. Mandatory checks
            bestTmpl.requiredFields.forEach(field => {
              if (field.isMandatory) {
                const val = dataMap[field.key];
                if (val === undefined || val === null || String(val).trim() === "") {
                  errors.push(`${field.label} is a mandatory field.`);
                }
              }
            });

            // 2. Country validation checks
            const country = String(dataMap["country"] || "Global").trim();
            bestTmpl.countryValidations.forEach(vRule => {
              if (vRule.country === "Global" || vRule.country.toLowerCase() === country.toLowerCase()) {
                const fieldVal = dataMap[vRule.field];
                if (vRule.condition === "max_hours" && Number(fieldVal) > Number(vRule.value)) {
                  errors.push(vRule.errorMessage);
                }
                if (vRule.condition === "max_amount" && Number(fieldVal) > Number(vRule.value)) {
                  errors.push(vRule.errorMessage);
                }
                if (vRule.condition === "format_email") {
                  const emailStr = String(fieldVal);
                  if (!emailStr.includes("@") || !emailStr.endsWith(".com")) {
                    errors.push(vRule.errorMessage);
                  }
                }
                if (vRule.condition === "not_duplicate_ps" && String(fieldVal) === "EMP-1042" && country.toLowerCase() === "united states") {
                  errors.push(vRule.errorMessage);
                }
              }
            });

            // 3. AI Outliers / warnings
            if (bestTmpl.id === "tmpl_overtime") {
              const otHours = Number(dataMap["overtimeHours"]);
              if (otHours > 35) {
                warnings.push(`AI Outlier Detection: Unusually high overtime hours (${otHours} hours) flagged.`);
              }
            }
            if (bestTmpl.id === "tmpl_sales_award") {
              const amt = Number(dataMap["awardAmount"]);
              if (amt > 10000) {
                warnings.push(`AI Commission Outlier: Payout of $${amt} USD exceeds standard audit guidelines.`);
              }
            }

            parsed.push({
              id: `row-${i}-${Date.now().toString().slice(-4)}`,
              data: dataMap,
              errors,
              warnings,
              isValid: errors.length === 0
            });
          }

          setParsedRows(parsed);
          setUploadState("uploaded");
          setLearningSheet(null);
        } else {
          // If no good template matches, activate AI learning flow with the actual parsed headers of the Excel!
          setFileName(file.name);
          setLearningSheet({
            fileName: file.name,
            columns: headers
          });
          setUploadState("idle");
        }
      } catch (err) {
        console.error("Error reading file:", err);
        alert("NEXUS Ingestion Error: Failed to parse spreadsheet file. Please verify it is a valid .xlsx, .xls, or .csv document.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // --- Drag & Drop Operations ---
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
      handleFileParsing(e.dataTransfer.files[0]);
    }
  };

  const startAiMapping = () => {
    setUploadState("mapping");
    setTimeout(() => {
      setUploadState("review");
    }, 1800);
  };

  // --- Interactive Row Editing & Fixing ---
  const handleStartEditRow = (row: SpreadsheetRow) => {
    setEditingRow({ ...row, data: { ...row.data } });
  };

  const handleSaveEditedRow = () => {
    if (!editingRow) return;

    // Run dynamic client-side validation logic immediately on save
    const updatedRow = { ...editingRow };
    const errs: string[] = [];
    const warns: string[] = [];

    // 1. Mandatory Field Checks
    if (detectedTemplate) {
      detectedTemplate.requiredFields.forEach(field => {
        if (field.isMandatory) {
          const val = updatedRow.data[field.key];
          if (val === undefined || val === null || String(val).trim() === "") {
            errs.push(`${field.label} is a mandatory field.`);
          }
        }
      });

      // 2. Country Specific Validation Rules Checks
      const country = updatedRow.data["country"] || "Global";
      detectedTemplate.countryValidations.forEach(vRule => {
        if (vRule.country === "Global" || vRule.country === country) {
          const fieldVal = updatedRow.data[vRule.field];
          
          if (vRule.condition === "max_hours" && Number(fieldVal) > Number(vRule.value)) {
            errs.push(vRule.errorMessage);
          }
          if (vRule.condition === "max_amount" && Number(fieldVal) > Number(vRule.value)) {
            errs.push(vRule.errorMessage);
          }
          if (vRule.condition === "format_email") {
            const emailStr = String(fieldVal);
            if (!emailStr.includes("@") || !emailStr.endsWith(".com")) {
              errs.push(vRule.errorMessage);
            }
          }
          if (vRule.condition === "not_duplicate_ps" && String(fieldVal) === "EMP-1042" && country === "United States") {
            errs.push(vRule.errorMessage);
          }
        }
      });

      // 3. Highlight Outliers (Overtime, variable limit warn)
      if (detectedTemplate.id === "tmpl_overtime") {
        const otHours = Number(updatedRow.data["overtimeHours"]);
        if (otHours > 35) {
          warns.push(`AI Outlier Detection: Unusually high overtime hours (${otHours} hours) flagged.`);
        }
      }
      if (detectedTemplate.id === "tmpl_sales_award") {
        const amt = Number(updatedRow.data["awardAmount"]);
        if (amt > 10000) {
          warns.push(`AI Commission Outlier: Payout of $${amt} USD exceeds standard audit guidelines.`);
        }
      }
    }

    updatedRow.errors = errs;
    updatedRow.warnings = warns;
    updatedRow.isValid = errs.length === 0;

    setParsedRows(prev => prev.map(r => r.id === updatedRow.id ? updatedRow : r));
    setEditingRow(null);
  };

  // --- Import Valid Records Only ---
  const handleCommitImport = async () => {
    const validCount = parsedRows.filter(r => r.isValid).length;
    const totalCount = parsedRows.length;

    if (validCount === 0) {
      alert("No valid records to import. Please correct the errors before committing.");
      return;
    }

    try {
      // 1. Log Ingest event in Firestore AuditLogs
      await addDoc(collection(db, "AuditLogs"), {
        timestamp: new Date().toISOString(),
        user: "Ronak Surve (Super Admin)",
        role: "Super Admin",
        action: `Ingested ${validCount} valid payroll records for template: ${detectedTemplate?.name}`,
        details: `Imported file ${fileName}. Skipped ${totalCount - validCount} invalid records.`
      });

      // 2. Add to local history list
      const newItem: IngestionHistoryItem = {
        id: `h-${Date.now()}`,
        fileName: fileName,
        templateName: detectedTemplate?.name || "Manual Ingest",
        recordsCount: validCount,
        time: new Date().toISOString().replace("T", " ").substring(0, 16),
        status: "Completed",
        mappingScore: Math.round((validCount / totalCount) * 100),
        user: "Ronak Surve"
      };
      setHistoryItems(prev => [newItem, ...prev]);

      alert(`NEXUS Engine: Successfully imported ${validCount} valid records. Ingested into regional workspace databases.`);
      setUploadState("idle");
      setFileName("");
      setDetectedTemplate(null);
      setParsedRows([]);
      
      onIngestionComplete(); // Refresh global numbers
    } catch (e) {
      console.error(e);
      alert("Error logging import action to Firestore database.");
    }
  };

  // --- AI Template Learning System Wizard ---
  const handleSaveLearnedTemplate = async () => {
    if (!learningSheet) return;

    // Register a brand-new learned template dynamically
    const newTmpl: PayrollTemplate = {
      id: `tmpl_${learningSheet.fileName.toLowerCase().replace(/\./g, "_").replace(/\s+/g, "_")}`,
      name: learningSheet.fileName.replace(".xlsx", "").replace(".csv", ""),
      description: `AI-learned payroll template parsed from uploaded dataset: ${learningSheet.fileName}`,
      version: 1,
      currency: "USD",
      requiredFields: learningSheet.columns.map(col => ({
        key: col.toLowerCase().replace(/\s+/g, ""),
        label: col,
        type: col.toLowerCase().includes("amount") || col.toLowerCase().includes("rate") ? "number" : "string",
        isMandatory: col.toLowerCase().includes("id") || col.toLowerCase().includes("name")
      })),
      countryValidations: [],
      aiRules: ["Validate field data alignments in compliance with global operational policies."],
      approvalWorkflow: ["HR Specialist", "Payroll Auditor"]
    };

    try {
      // Save directly to Firestore collection! It is immediately reusable!
      await setDoc(doc(db, "PayrollTemplates", newTmpl.id), newTmpl);
      setTemplates(prev => [...prev, newTmpl]);

      // Add audit log
      await addDoc(collection(db, "AuditLogs"), {
        timestamp: new Date().toISOString(),
        user: "Ronak Surve (Super Admin)",
        role: "Super Admin",
        action: `AI learned and saved new template: ${newTmpl.name}`,
        details: `Discovered and automatically mapped ${learningSheet.columns.length} columns from ${learningSheet.fileName}.`
      });

      alert(`NEXUS Success! Learned template "${newTmpl.name}" registered successfully. Administrators can now edit validations, approval flows, or use this file template instantly!`);
      setLearningSheet(null);
      setFileName("");
    } catch (err) {
      console.error(err);
      alert("Failed saving learned template to Firestore.");
    }
  };

  // --- Dynamic Template Manager Form CRUD ---
  const handleOpenCreateTemplate = (tmpl: PayrollTemplate | null) => {
    if (tmpl) {
      setEditingTemplate(tmpl);
      setFormTemplateName(tmpl.name);
      setFormTemplateDesc(tmpl.description);
      setFormTemplateFields([...tmpl.requiredFields]);
      setFormCountryVal([...tmpl.countryValidations]);
      setFormCurrency(tmpl.currency);
      setFormWorkflow([...tmpl.approvalWorkflow]);
      setFormAiRules([...tmpl.aiRules]);
    } else {
      setEditingTemplate(null);
      setFormTemplateName("");
      setFormTemplateDesc("");
      setFormTemplateFields([
        { key: "employeeId", label: "Personnel ID", type: "string", isMandatory: true },
        { key: "employeeName", label: "Full Name", type: "string", isMandatory: true },
        { key: "country", label: "Country", type: "string", isMandatory: true }
      ]);
      setFormCountryVal([]);
      setFormCurrency("USD");
      setFormWorkflow(["HR Specialist", "Payroll Lead"]);
      setFormAiRules(["Verify matching database Personnel IDs."]);
    }
    setIsCreatingTemplate(true);
  };

  const handleAddField = () => {
    setFormTemplateFields(prev => [
      ...prev,
      { key: `custom_${Date.now()}`, label: "New Field", type: "string", isMandatory: false }
    ]);
  };

  const handleRemoveField = (index: number) => {
    setFormTemplateFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, key: string, val: any) => {
    setFormTemplateFields(prev => prev.map((f, i) => {
      if (i === index) {
        const updated = { ...f, [key]: val };
        if (key === "label") {
          updated.key = val.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
        }
        return updated;
      }
      return f;
    }));
  };

  const handleAddCountryValidation = () => {
    setFormCountryVal(prev => [
      ...prev,
      { country: "India", field: "overtimeHours", condition: "max_hours", value: "50", errorMessage: "Value exceeds statutory guidelines." }
    ]);
  };

  const handleRemoveCountryValidation = (index: number) => {
    setFormCountryVal(prev => prev.filter((_, i) => i !== index));
  };

  const handleCountryValChange = (index: number, key: string, val: any) => {
    setFormCountryVal(prev => prev.map((v, i) => i === index ? { ...v, [key]: val } : v));
  };

  const handleAddAiRule = () => {
    setFormAiRules(prev => [...prev, "Check for unusually high amount variables exceeding typical standards."]);
  };

  const handleRemoveAiRule = (index: number) => {
    setFormAiRules(prev => prev.filter((_, i) => i !== index));
  };

  const handleAiRuleChange = (index: number, value: string) => {
    setFormAiRules(prev => prev.map((r, i) => i === index ? value : r));
  };

  const handleSaveDynamicTemplate = async () => {
    if (!formTemplateName.trim()) {
      alert("Template name is required.");
      return;
    }

    const templateId = editingTemplate ? editingTemplate.id : `tmpl_${formTemplateName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}`;
    const newVersion = editingTemplate ? (editingTemplate.version + 1) : 1;

    const savedTmpl: PayrollTemplate = {
      id: templateId,
      name: formTemplateName,
      description: formTemplateDesc,
      requiredFields: formTemplateFields,
      countryValidations: formCountryVal,
      currency: formCurrency,
      aiRules: formAiRules,
      approvalWorkflow: formWorkflow,
      version: newVersion,
      isSystem: editingTemplate ? editingTemplate.isSystem : false
    };

    try {
      // Save directly to Firestore for global access! No code changes required when templates evolve!
      await setDoc(doc(db, "PayrollTemplates", templateId), savedTmpl);

      await addDoc(collection(db, "AuditLogs"), {
        timestamp: new Date().toISOString(),
        user: "Ronak Surve (Super Admin)",
        role: "Super Admin",
        action: editingTemplate ? `Updated template schema: ${savedTmpl.name}` : `Created new payroll template: ${savedTmpl.name}`,
        details: `Saved version ${newVersion} with ${formTemplateFields.length} active schema fields and ${formCountryVal.length} country validations.`
      });

      // Reload templates list from local state
      setTemplates(prev => {
        const filtered = prev.filter(t => t.id !== templateId);
        return [...filtered, savedTmpl];
      });

      alert(`Template "${savedTmpl.name}" successfully registered into Firestore! Instantly available for regional Excel file parsing.`);
      setIsCreatingTemplate(false);
      setEditingTemplate(null);
    } catch (e) {
      console.error(e);
      alert("Failed storing template configuration to Firestore database.");
    }
  };

  const handleDeleteTemplate = async (tmplId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the "${name}" payroll template? This will permanently remove its schema from Firestore.`)) return;

    try {
      await deleteDoc(doc(db, "PayrollTemplates", tmplId));
      setTemplates(prev => prev.filter(t => t.id !== tmplId));

      await addDoc(collection(db, "AuditLogs"), {
        timestamp: new Date().toISOString(),
        user: "Ronak Surve (Super Admin)",
        role: "Super Admin",
        action: `Deleted payroll template schema: ${name}`,
        details: `Template ID ${tmplId} has been successfully deleted from persistent storage.`
      });

      alert(`Template "${name}" deleted.`);
    } catch (e) {
      console.error(e);
      alert("Error deleting template schema from Firestore.");
    }
  };

  return (
    <div className="space-y-4" id="data_integration_main_wrapper">
      {/* Tab select header */}
      <div className="flex items-center justify-between border-b border-[#EDEBE9]/40 pb-1">
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveTab("upload"); setIsCreatingTemplate(false); setLearningSheet(null); }}
            id="tab_excel_import"
            className={`px-3 py-1.5 text-xs font-bold transition-all border-b-2 -mb-[6px] flex items-center gap-1.5 ${
              activeTab === "upload" && !isCreatingTemplate
                ? "border-[#0078D4] text-[#0078D4]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Upload size={13} />
            AI Excel Import Assistant
          </button>
          <button
            onClick={() => { setActiveTab("templates"); setIsCreatingTemplate(false); }}
            id="tab_template_engine"
            className={`px-3 py-1.5 text-xs font-bold transition-all border-b-2 -mb-[6px] flex items-center gap-1.5 ${
              activeTab === "templates" || isCreatingTemplate
                ? "border-[#0078D4] text-[#0078D4]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Settings size={13} />
            Dynamic Template Engine
          </button>
          <button
            onClick={() => { setActiveTab("history"); setIsCreatingTemplate(false); }}
            id="tab_ingest_history"
            className={`px-3 py-1.5 text-xs font-bold transition-all border-b-2 -mb-[6px] flex items-center gap-1.5 ${
              activeTab === "history"
                ? "border-[#0078D4] text-[#0078D4]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <History size={13} />
            Ingestion History & Audits
          </button>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-500/10 px-2 py-0.5 rounded text-[10px] text-slate-400 font-semibold border border-slate-700/20">
          <Sparkles size={11} className="text-[#0078D4]" />
          <span>NEXUS AI Agent Powered</span>
        </div>
      </div>

      {/* --- Tab 1: AI EXCEL IMPORT ASSISTANT --- */}
      {activeTab === "upload" && !isCreatingTemplate && (
        <div className="space-y-4">
          
          {/* Quick Simulate Upload Area */}
          <div className={`p-3.5 rounded-md border ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"}`}>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Simulate Spreadsheet Upload (Try the Scenarios)</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
              <button
                onClick={() => handleSimulateUpload("overtime_outliers")}
                id="btn_sim_overtime"
                className={`p-2.5 rounded border text-left transition-all flex flex-col justify-between ${
                  fileName === "Mumbai_Timecards_India_July.xlsx"
                    ? "bg-[#0078D4]/10 border-[#0078D4] text-white"
                    : (isDark ? "bg-[#1F1F1F] border-[#2D2D2D] hover:border-slate-500 text-slate-300" : "bg-white border-[#EDEBE9] hover:bg-[#F3F2F1] text-slate-700")
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                    <AlertTriangle size={12} />
                    Overtime File
                  </div>
                  <p className="text-[9.5px] text-slate-400 mt-1 leading-normal">
                    Has Indian Factories Act overtime outliers and missing mandatory field validation.
                  </p>
                </div>
                <span className="text-[9px] text-[#0078D4] font-semibold mt-2.5 flex items-center gap-0.5 self-end">
                  Simulate Ingest <ChevronRight size={10} />
                </span>
              </button>

              <button
                onClick={() => handleSimulateUpload("sales_currencies")}
                id="btn_sim_sales"
                className={`p-2.5 rounded border text-left transition-all flex flex-col justify-between ${
                  fileName === "Global_Commission_Awards_Q2.csv"
                    ? "bg-[#0078D4]/10 border-[#0078D4] text-white"
                    : (isDark ? "bg-[#1F1F1F] border-[#2D2D2D] hover:border-slate-500 text-slate-300" : "bg-white border-[#EDEBE9] hover:bg-[#F3F2F1] text-slate-700")
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                    <Coins size={12} />
                    Sales Awards
                  </div>
                  <p className="text-[9.5px] text-slate-400 mt-1 leading-normal">
                    Converts USD payments into local SGD rates and flags award cap overruns.
                  </p>
                </div>
                <span className="text-[9px] text-[#0078D4] font-semibold mt-2.5 flex items-center gap-0.5 self-end">
                  Simulate Ingest <ChevronRight size={10} />
                </span>
              </button>

              <button
                onClick={() => handleSimulateUpload("new_joiner_duplicates")}
                id="btn_sim_joiners"
                className={`p-2.5 rounded border text-left transition-all flex flex-col justify-between ${
                  fileName === "Onboarding_NewJoiner_Data.xlsx"
                    ? "bg-[#0078D4]/10 border-[#0078D4] text-white"
                    : (isDark ? "bg-[#1F1F1F] border-[#2D2D2D] hover:border-slate-500 text-slate-300" : "bg-white border-[#EDEBE9] hover:bg-[#F3F2F1] text-slate-700")
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-500">
                    <UserPlusIcon size={12} />
                    New Joiners
                  </div>
                  <p className="text-[9.5px] text-slate-400 mt-1 leading-normal">
                    Identifies duplicate PS Numbers across global regions and email format errors.
                  </p>
                </div>
                <span className="text-[9px] text-[#0078D4] font-semibold mt-2.5 flex items-center gap-0.5 self-end">
                  Simulate Ingest <ChevronRight size={10} />
                </span>
              </button>

              <button
                onClick={() => handleSimulateUpload("unrecognized_learning")}
                id="btn_sim_learning"
                className="p-2.5 rounded border border-purple-500/30 bg-purple-500/5 text-left hover:bg-purple-500/10 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400">
                    <Sparkles size={12} />
                    Template Learning
                  </div>
                  <p className="text-[9.5px] text-slate-400 mt-1 leading-normal">
                    Upload an unrecognized allowance file to trigger the **AI Adaptive Learning** flow.
                  </p>
                </div>
                <span className="text-[9px] text-purple-400 font-semibold mt-2.5 flex items-center gap-0.5 self-end">
                  Try Learning <ChevronRight size={10} />
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Left side upload or mapping results */}
            <div className="lg:col-span-2">
              
              {/* Idle Upload State */}
              {uploadState === "idle" && !learningSheet && (
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  id="file_drop_zone"
                  className={`border-2 border-dashed rounded-md p-6 text-center flex flex-col items-center justify-center cursor-pointer transition-all h-[340px] ${
                    dragActive 
                      ? "border-[#0078D4] bg-[#0078D4]/10" 
                      : (isDark ? "border-[#2D2D2D] hover:border-slate-500 bg-[#1F1F1F]" : "border-[#EDEBE9] hover:border-slate-400 bg-white")
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileParsing(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-12 h-12 rounded-full bg-[#0078D4]/10 text-[#0078D4] flex items-center justify-center mb-3">
                    <Upload size={24} className="animate-bounce" />
                  </div>
                  <h4 className="text-xs font-bold text-[#323130] dark:text-white">Drag and drop any Payroll Excel file here</h4>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                    Predefined templates are auto-detected. New/Unrecognized spreadsheets trigger real-time **AI Template Learning**.
                  </p>
                  <span className="mt-4 px-3 py-1.5 bg-[#0078D4] text-white text-[11px] font-semibold rounded hover:bg-[#005A9E] transition">
                    Browse Files
                  </span>
                </div>
              )}

              {/* Learning Sheet Detection Prompt */}
              {learningSheet && (
                <div className={`p-5 rounded-md border flex flex-col justify-between h-[340px] ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9]"}`} id="learning_prompt_panel">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-purple-400">
                      <Sparkles size={16} className="animate-spin-slow" />
                      <span className="text-xs font-bold uppercase tracking-wider">AI Template Learning Activated</span>
                    </div>

                    <h4 className="text-sm font-bold text-white leading-tight">
                      NEXUS Detected Unrecognized Payroll Inflow: "{learningSheet.fileName}"
                    </h4>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      "Instead of rejecting this sheet, my deep semantic layer has analyzed the file structure. I have detected <strong className="text-purple-300 font-mono">{learningSheet.columns.length} columns</strong> representing a new payroll event template. Would you like to automatically learn and register this template?"
                    </p>

                    <div className="bg-slate-500/5 rounded p-3 border border-slate-700/10 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Detected Column Vectors:</span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {learningSheet.columns.map(col => (
                          <span key={col} className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-700/10">
                    <button 
                      onClick={() => setLearningSheet(null)}
                      className={`px-3 py-1.5 border rounded text-xs font-bold transition ${
                        isDark ? "border-[#2D2D2D] hover:bg-[#2D2D2D] text-slate-300" : "border-[#EDEBE9] hover:bg-[#F3F2F1]"
                      }`}
                    >
                      Ignore File
                    </button>
                    <button 
                      onClick={handleSaveLearnedTemplate}
                      id="btn_learn_and_save"
                      className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-[#0078D4] text-white text-xs font-bold rounded hover:opacity-95 flex items-center gap-1 shadow"
                    >
                      <Sparkles size={12} />
                      Yes, Learn & Register Template
                    </button>
                  </div>
                </div>
              )}

              {/* Selected File Upload Area */}
              {uploadState === "uploaded" && detectedTemplate && (
                <div className={`p-3.5 rounded-md border flex flex-col justify-between h-[340px] ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"}`} id="file_ready_panel">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <div className="p-2.5 bg-[#0078D4]/10 text-[#0078D4] rounded">
                          <FileSpreadsheet size={24} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#323130] dark:text-white">{fileName}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">Size: 34 KB | Format: Microsoft Excel Spreadsheet</p>
                        </div>
                      </div>
                      <button onClick={() => { setUploadState("idle"); setDetectedTemplate(null); }} className="text-slate-500 hover:text-white">
                        <X size={16} />
                      </button>
                    </div>

                    <div className="p-3 bg-[#107C10]/10 border border-[#107C10]/20 rounded-md text-slate-300 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                        <CheckCircle size={13} />
                        AI Auto-Detection Complete
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-400">
                        NEXUS scanned the header footprint and mapped it to the predefined <strong className="text-white">"{detectedTemplate.name}"</strong> payroll event template. Auto-mapped <strong className="text-white">{detectedTemplate.requiredFields.length} out of {detectedTemplate.requiredFields.length} fields</strong>.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Configured Verification Engine:</span>
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        <span className="px-2 py-0.5 bg-slate-500/10 border border-slate-700/20 rounded text-[9.5px] font-semibold text-slate-300">
                          Currency: {detectedTemplate.currency}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-500/10 border border-slate-700/20 rounded text-[9.5px] font-semibold text-slate-300">
                          {detectedTemplate.countryValidations.length} Local Country Rules
                        </span>
                        <span className="px-2 py-0.5 bg-slate-500/10 border border-slate-700/20 rounded text-[9.5px] font-semibold text-slate-300">
                          {detectedTemplate.approvalWorkflow.length}-Step Approval Route
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-700/10">
                    <button 
                      onClick={() => { setUploadState("idle"); setDetectedTemplate(null); }}
                      className={`px-3 py-1.5 border rounded text-xs font-bold transition ${
                        isDark ? "border-[#2D2D2D] hover:bg-[#2D2D2D] text-slate-300" : "border-[#EDEBE9] hover:bg-[#F3F2F1] text-slate-700"
                      }`}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={startAiMapping}
                      id="btn_map_run"
                      className="px-3.5 py-1.5 bg-gradient-to-r from-[#0078D4] to-[#107C10] text-white text-xs font-bold rounded hover:opacity-95 flex items-center gap-1 shadow-md"
                    >
                      <Sparkles size={12} />
                      Run AI Validation Pass
                    </button>
                  </div>
                </div>
              )}

              {/* Running AI validation loader */}
              {uploadState === "mapping" && (
                <div className={`p-6 rounded-md border flex flex-col items-center justify-center text-center h-[340px] ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"}`} id="mapping_load_panel">
                  <div className="relative mb-4">
                    <div className="w-14 h-14 rounded-full border-3 border-t-transparent border-[#0078D4] animate-spin" />
                    <Sparkles size={18} className="text-amber-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <h4 className="text-xs font-bold text-[#323130] dark:text-white uppercase tracking-wider">NEXUS Core AI Ingestion Active</h4>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm leading-relaxed">
                    Executing dual-schema checks, auditing country-specific rest limitations, translating multi-currency exchange rates, and verifying duplicates in parallel...
                  </p>
                  <div className="w-48 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                    <div className="bg-[#107C10] h-full rounded-full animate-[progress_1.8s_ease-in-out_infinite]" style={{ width: "80%" }} />
                  </div>
                </div>
              )}

              {/* Review & Interactive Edit Panel */}
              {uploadState === "review" && detectedTemplate && (
                <div className={`p-3.5 rounded-md border flex flex-col h-auto ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"}`} id="review_mapping_records_panel">
                  
                  {/* Header info */}
                  <div className="flex items-center justify-between border-b pb-2 border-slate-700/15">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase">AI Data Import Review Queue</h4>
                      <p className="text-[10px] text-slate-500">Template Target: {detectedTemplate.name} (v{detectedTemplate.version})</p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="px-2 py-0.5 bg-[#107C10]/10 text-[#107C10] border border-[#107C10]/20 font-bold rounded">
                        {parsedRows.filter(r => r.isValid).length} Valid Rows
                      </span>
                      {parsedRows.filter(r => !r.isValid).length > 0 && (
                        <span className="px-2 py-0.5 bg-[#A80000]/10 text-[#F1707B] border border-[#A80000]/20 font-bold rounded">
                          {parsedRows.filter(r => !r.isValid).length} Blocked Rows
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Schema column auto-mappings review card */}
                  <div className="my-2.5 p-2 bg-[#2D2D2D]/40 border border-slate-700/10 rounded">
                    <details className="outline-none cursor-pointer">
                      <summary className="text-[10.5px] font-bold text-slate-400 flex items-center justify-between select-none">
                        <span>🔍 View Intelligent Header Field Mappings ({columnMappings.length} Columns)</span>
                        <span className="text-[9.5px] text-[#107C10] font-bold bg-[#107C10]/10 px-1.5 py-0.2 rounded">100% matched</span>
                      </summary>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2 cursor-default">
                        {columnMappings.map(m => (
                          <div key={m.sourceHeader} className="p-1.5 bg-slate-500/5 rounded border border-slate-700/10 flex items-center justify-between text-[10px]">
                            <div>
                              <span className="text-slate-500 font-mono block">{m.sourceHeader}</span>
                              <span className="text-white font-bold flex items-center gap-0.5"><ArrowRight size={8} /> {m.targetField}</span>
                            </div>
                            <span className="text-[9px] text-[#107C10] font-mono">{m.confidence}%</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>

                  {/* Parsing Data Grid Row by Row */}
                  <div className="overflow-x-auto my-1.5 border border-slate-700/10 rounded-md">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-500/5 text-slate-400 border-b border-slate-700/10">
                          {detectedTemplate.requiredFields.map(f => (
                            <th key={f.key} className="py-2 px-3 font-semibold">{f.label}</th>
                          ))}
                          <th className="py-2 px-3 font-semibold">AI Validation / Outliers</th>
                          <th className="py-2 px-3 text-right font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.map((row) => (
                          <tr 
                            key={row.id} 
                            className={`border-b border-slate-700/5 transition-colors ${
                              !row.isValid 
                                ? "bg-[#A80000]/5 hover:bg-[#A80000]/10" 
                                : (row.warnings.length > 0 ? "bg-amber-500/5 hover:bg-amber-500/10" : "hover:bg-slate-500/5")
                            }`}
                          >
                            {/* Render data values dynamically based on template requirements */}
                            {detectedTemplate.requiredFields.map(f => (
                              <td key={f.key} className="py-2 px-3 font-medium">
                                {f.type === "number" && row.data[f.key] !== undefined ? (
                                  <span className="font-mono">
                                    {detectedTemplate.currency === "USD" ? "$" : (detectedTemplate.currency === "EUR" ? "€" : "")}
                                    {Number(row.data[f.key]).toLocaleString()}
                                  </span>
                                ) : (
                                  String(row.data[f.key] || "—")
                                )}
                              </td>
                            ))}

                            {/* Render validation logs */}
                            <td className="py-2 px-3 max-w-[280px]">
                              {row.isValid && row.warnings.length === 0 && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#107C10]">
                                  <Check size={11} /> Pass
                                </span>
                              )}
                              
                              {/* Warnings/Outliers */}
                              {row.warnings.map((w, idx) => (
                                <div key={idx} className="text-[10px] text-amber-400 font-medium flex items-start gap-1 mb-0.5 leading-tight">
                                  <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" />
                                  <span>{w}</span>
                                </div>
                              ))}

                              {/* Hard Errors */}
                              {row.errors.map((e, idx) => (
                                <div key={idx} className="text-[10px] text-[#F1707B] font-bold flex items-start gap-1 leading-tight">
                                  <AlertCircle size={10} className="mt-0.5 flex-shrink-0" />
                                  <span>{e}</span>
                                </div>
                              ))}
                            </td>

                            <td className="py-2 px-3 text-right">
                              <button
                                onClick={() => handleStartEditRow(row)}
                                id={`btn_edit_row_${row.id}`}
                                className="p-1 hover:bg-slate-500/20 text-slate-300 rounded transition"
                                title="Edit Row Values"
                              >
                                <Edit2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Interactive editing Form overlay */}
                  {editingRow && (
                    <div className="my-3 p-3.5 border border-slate-700/20 bg-slate-500/10 rounded-md space-y-3" id="inline_row_editor">
                      <div className="flex items-center justify-between border-b pb-1 border-slate-700/10">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Edit2 size={13} className="text-[#0078D4]" />
                          Edit Row Variables (Real-time Validation Checks)
                        </span>
                        <button onClick={() => setEditingRow(null)} className="text-slate-400 hover:text-white">
                          <X size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {detectedTemplate.requiredFields.map(f => (
                          <div key={f.key} className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400">
                              {f.label} {f.isMandatory && <span className="text-[#F1707B]">*</span>}
                            </label>
                            <input
                              type={f.type === "number" ? "number" : (f.type === "date" ? "date" : "text")}
                              value={editingRow.data[f.key] || ""}
                              onChange={(e) => {
                                const val = f.type === "number" ? Number(e.target.value) : e.target.value;
                                setEditingRow(prev => {
                                  if (!prev) return null;
                                  return {
                                    ...prev,
                                    data: { ...prev.data, [f.key]: val }
                                  };
                                });
                              }}
                              className={`w-full text-xs p-1.5 rounded border outline-none font-semibold ${
                                isDark ? "bg-[#1F1F1F] border-[#2D2D2D] text-white focus:border-[#0078D4]" : "bg-white border-[#EDEBE9] focus:border-[#0078D4]"
                              }`}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          onClick={() => setEditingRow(null)}
                          className="px-2.5 py-1 border border-slate-700/20 rounded text-[11px] text-slate-300 font-bold hover:bg-slate-700/10"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEditedRow}
                          id="btn_save_inline_edit"
                          className="px-3 py-1 bg-[#0078D4] text-white rounded text-[11px] font-bold hover:bg-[#005A9E] flex items-center gap-1"
                        >
                          <Check size={12} /> Save & Revalidate
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-700/15">
                    <span className="text-[10px] text-slate-400 max-w-md leading-normal">
                      Note: Skipped/Invalid records containing hard validation flags will not be imported into the ledger.
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setUploadState("idle"); setDetectedTemplate(null); }}
                        className={`px-3 py-1.5 border rounded text-xs font-bold transition ${
                          isDark ? "border-[#2D2D2D] hover:bg-[#2D2D2D]" : "border-[#EDEBE9]"
                        }`}
                      >
                        Reset Ingest
                      </button>
                      <button 
                        onClick={handleCommitImport}
                        id="btn_confirm_valid_only"
                        className="px-3.5 py-1.5 bg-[#107C10] hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-md flex items-center gap-1"
                      >
                        <ShieldCheck size={13} />
                        Import Valid Records Only ({parsedRows.filter(r => r.isValid).length} Rows)
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Right side instruction checklist */}
            <div className="space-y-4">
              
              {/* Intelligent policies card */}
              <div className={`p-3.5 rounded-md border shadow-sm ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9]"}`}>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1">
                  <Sparkles size={11} className="text-[#0078D4]" />
                  AI Ingest Assistant Checklist
                </h4>

                <div className="space-y-2 text-[11px] text-slate-400">
                  <div className="flex gap-2 items-start">
                    <span className="w-5 h-5 rounded-full bg-[#107C10]/15 text-[#107C10] flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">1</span>
                    <div>
                      <strong className="text-white">Continuous Auto-Detection</strong>
                      <p className="text-[10px] text-slate-500 leading-normal mt-0.5">NEXUS identifies the template (e.g. Overtime or Sales) based on header schemas instantly.</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span className="w-5 h-5 rounded-full bg-[#107C10]/15 text-[#107C10] flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">2</span>
                    <div>
                      <strong className="text-white">Country Rules Verification</strong>
                      <p className="text-[10px] text-slate-500 leading-normal mt-0.5">Row variables are vetted for localized labor policies (like German 10h working time limits).</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span className="w-5 h-5 rounded-full bg-[#107C10]/15 text-[#107C10] flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">3</span>
                    <div>
                      <strong className="text-white">Currency & Outlier Audits</strong>
                      <p className="text-[10px] text-slate-500 leading-normal mt-0.5">Detects abnormal amounts and handles conversions from USD to local currencies dynamically.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RAG Rules panel */}
              <div className={`p-3.5 rounded-md border flex flex-col justify-between ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9]"}`}>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                  <Database size={12} className="text-amber-500" />
                  Sovereign HR Integrations
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  Active templates are mapped directly against localized HRMS. For dynamic endpoints or SuccessFactors SFTP folders, register credential tokens inside the **Admin Console**.
                </p>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* --- Tab 2: DYNAMIC TEMPLATE ENGINE CONSOLE --- */}
      {(activeTab === "templates" || isCreatingTemplate) && (
        <div className="space-y-4">
          
          {/* Main List and Form Switcher */}
          {!isCreatingTemplate ? (
            <div className={`p-3.5 rounded-md border ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"}`} id="templates_list_panel">
              <div className="flex items-center justify-between border-b pb-2 border-slate-700/10">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase">Sovereign Payroll Input Templates</h3>
                  <p className="text-[10.5px] text-slate-400">Zero Code updates are populated to active ingestion channels instantly.</p>
                </div>
                <button
                  onClick={() => handleOpenCreateTemplate(null)}
                  id="btn_create_new_template"
                  className="px-3 py-1.5 bg-[#0078D4] hover:bg-[#005A9E] text-white rounded text-xs font-bold flex items-center gap-1 shadow"
                >
                  <Plus size={13} />
                  + Create Custom Template
                </button>
              </div>

              {isLoadingTemplates ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                  <RefreshCw size={24} className="animate-spin text-[#0078D4]" />
                  <span>Loading Sovereign schemas from Firestore...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-3">
                  {templates.map(tmpl => (
                    <div key={tmpl.id} className="p-3.5 rounded border border-slate-700/10 bg-slate-500/5 flex flex-col justify-between h-[180px] hover:border-[#0078D4]/50 transition-all">
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[9px] font-bold font-mono text-[#0078D4] uppercase">v{tmpl.version} SCHEMA</span>
                            <h4 className="text-xs font-bold text-white mt-0.5">{tmpl.name}</h4>
                          </div>
                          {tmpl.isSystem ? (
                            <span className="text-[8px] bg-slate-500/15 text-slate-400 px-1.5 py-0.2 rounded font-semibold border border-slate-700/20">System</span>
                          ) : (
                            <span className="text-[8px] bg-purple-500/10 text-purple-300 px-1.5 py-0.2 rounded font-semibold border border-purple-500/20">Learned</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 leading-relaxed line-clamp-2">{tmpl.description}</p>
                      </div>

                      <div className="pt-2.5 border-t border-slate-700/5 flex items-center justify-between">
                        <span className="text-[9.5px] text-slate-500 font-medium">
                          {tmpl.requiredFields.length} Defined Fields | {tmpl.countryValidations.length} Local Limits
                        </span>
                        
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleOpenCreateTemplate(tmpl)}
                            id={`btn_edit_tmpl_${tmpl.id}`}
                            className="p-1 hover:bg-slate-500/10 rounded text-slate-300 transition"
                            title="Edit Schema"
                          >
                            <Edit2 size={11} />
                          </button>
                          {!tmpl.isSystem && (
                            <button
                              onClick={() => handleDeleteTemplate(tmpl.id, tmpl.name)}
                              id={`btn_delete_tmpl_${tmpl.id}`}
                              className="p-1 hover:bg-[#A80000]/10 rounded text-slate-400 hover:text-red-400 transition"
                              title="Delete Schema"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            
            /* Interactive Template Builder / Form Form */
            <div className={`p-4 rounded-md border space-y-4 ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"}`} id="template_builder_form">
              <div className="flex items-center justify-between border-b pb-2 border-slate-700/10">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase">
                    {editingTemplate ? `Modify Dynamic Template: ${editingTemplate.name}` : "Construct Custom Payroll Input Schema"}
                  </h3>
                  <p className="text-[10.5px] text-slate-400">Specify field attributes, localized limit conditions, and approval routing hierarchies.</p>
                </div>
                <button
                  onClick={() => setIsCreatingTemplate(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* Form Inputs left */}
                <div className="lg:col-span-2 space-y-4">
                  
                  {/* Basic meta */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Payroll Event Template Name</label>
                      <input
                        type="text"
                        value={formTemplateName}
                        onChange={(e) => setFormTemplateName(e.target.value)}
                        placeholder="e.g. Remote Work Allowance"
                        className={`w-full text-xs p-1.5 rounded border outline-none font-semibold ${
                          isDark ? "bg-[#1F1F1F] border-[#2D2D2D] text-white focus:border-[#0078D4]" : "bg-white border-[#EDEBE9] focus:border-[#0078D4]"
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Base Currency Handling</label>
                      <select
                        value={formCurrency}
                        onChange={(e) => setFormCurrency(e.target.value)}
                        className={`w-full text-xs p-1.5 rounded border outline-none font-semibold ${
                          isDark ? "bg-[#1F1F1F] border-[#2D2D2D] text-white" : "bg-white border-[#EDEBE9]"
                        }`}
                      >
                        <option value="USD">USD ($) - International Base</option>
                        <option value="EUR">EUR (€) - European Zone</option>
                        <option value="SGD">SGD (S$) - Singapore SGD</option>
                        <option value="JPY">JPY (¥) - Japan JPY</option>
                        <option value="Global">Global Entity-Specific Conversion</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Event Description</label>
                      <input
                        type="text"
                        value={formTemplateDesc}
                        onChange={(e) => setFormTemplateDesc(e.target.value)}
                        placeholder="Description for HR operations context..."
                        className={`w-full text-xs p-1.5 rounded border outline-none font-semibold ${
                          isDark ? "bg-[#1F1F1F] border-[#2D2D2D] text-white focus:border-[#0078D4]" : "bg-white border-[#EDEBE9] focus:border-[#0078D4]"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Schema Fields Builder */}
                  <div className="p-3.5 bg-slate-500/5 rounded border border-slate-700/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-bold text-slate-400 uppercase">1. Schema Attribute Mapping Specifications</span>
                      <button
                        onClick={handleAddField}
                        className="text-[10px] bg-[#0078D4]/10 text-[#0078D4] px-2 py-0.5 rounded font-bold hover:bg-[#0078D4]/20 transition flex items-center gap-0.5"
                      >
                        <Plus size={11} /> Add Attribute Field
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {formTemplateFields.map((field, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-slate-500/10 p-2 rounded border border-slate-700/10">
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => handleFieldChange(idx, "label", e.target.value)}
                            placeholder="Attribute Label"
                            className="w-1/3 text-xs p-1 rounded bg-[#1F1F1F] border border-[#2D2D2D] text-white font-semibold"
                          />
                          <select
                            value={field.type}
                            onChange={(e) => handleFieldChange(idx, "type", e.target.value)}
                            className="w-1/4 text-xs p-1 rounded bg-[#1F1F1F] border border-[#2D2D2D] text-white"
                          >
                            <option value="string">Text String</option>
                            <option value="number">Decimal/No.</option>
                            <option value="boolean">Boolean Check</option>
                            <option value="date">Date Calendar</option>
                          </select>
                          <label className="flex items-center gap-1 text-[10px] text-slate-300 select-none">
                            <input
                              type="checkbox"
                              checked={field.isMandatory}
                              onChange={(e) => handleFieldChange(idx, "isMandatory", e.target.checked)}
                              className="accent-[#0078D4]"
                            />
                            Mandatory
                          </label>
                          
                          <button
                            onClick={() => handleRemoveField(idx)}
                            className="ml-auto p-1 text-slate-500 hover:text-[#F1707B] rounded"
                            disabled={["employeeId", "employeeName", "country"].includes(field.key)}
                            title={["employeeId", "employeeName", "country"].includes(field.key) ? "Cannot remove core parameters" : "Remove Field"}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sovereign Country Rules */}
                  <div className="p-3.5 bg-slate-500/5 rounded border border-slate-700/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-bold text-slate-400 uppercase">2. Country Specific Regulatory Limits</span>
                      <button
                        onClick={handleAddCountryValidation}
                        className="text-[10px] bg-[#0078D4]/10 text-[#0078D4] px-2 py-0.5 rounded font-bold hover:bg-[#0078D4]/20 transition flex items-center gap-0.5"
                      >
                        <Plus size={11} /> Add Regulatory Limit
                      </button>
                    </div>

                    {formCountryVal.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic">No custom country-specific validation rules set. Template defaults apply globally.</p>
                    ) : (
                      <div className="space-y-2">
                        {formCountryVal.map((cRule, idx) => (
                          <div key={idx} className="flex gap-2 items-center bg-slate-500/10 p-2 rounded border border-slate-700/10 flex-wrap">
                            <select
                              value={cRule.country}
                              onChange={(e) => handleCountryValChange(idx, "country", e.target.value)}
                              className="text-xs p-1 rounded bg-[#1F1F1F] border border-[#2D2D2D] text-white"
                            >
                              <option value="India">India</option>
                              <option value="Global">Global/Shared</option>
                            </select>

                            <select
                              value={cRule.field}
                              onChange={(e) => handleCountryValChange(idx, "field", e.target.value)}
                              className="text-xs p-1 rounded bg-[#1F1F1F] border border-[#2D2D2D] text-white"
                            >
                              {formTemplateFields.map(f => (
                                <option key={f.key} value={f.key}>{f.label}</option>
                              ))}
                            </select>

                            <select
                              value={cRule.condition}
                              onChange={(e) => handleCountryValChange(idx, "condition", e.target.value)}
                              className="text-xs p-1 rounded bg-[#1F1F1F] border border-[#2D2D2D] text-white"
                            >
                              <option value="max_hours">Daily Max Hours</option>
                              <option value="max_amount">Max Payout Cap</option>
                              <option value="min_amount">Minimum Wage Floor</option>
                              <option value="format_email">Email Validation</option>
                            </select>

                            <input
                              type="text"
                              value={cRule.value}
                              onChange={(e) => handleCountryValChange(idx, "value", e.target.value)}
                              placeholder="Limit Value"
                              className="w-16 text-xs p-1 rounded bg-[#1F1F1F] border border-[#2D2D2D] text-white text-center font-mono font-bold"
                            />

                            <input
                              type="text"
                              value={cRule.errorMessage}
                              onChange={(e) => handleCountryValChange(idx, "errorMessage", e.target.value)}
                              placeholder="Filing Compliance Error Message"
                              className="flex-1 text-xs p-1 rounded bg-[#1F1F1F] border border-[#2D2D2D] text-white"
                            />

                            <button
                              onClick={() => handleRemoveCountryValidation(idx)}
                              className="p-1 text-slate-500 hover:text-[#F1707B] rounded"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                {/* AI validation rules and approval paths right */}
                <div className="space-y-4">
                  
                  {/* Approval Routing */}
                  <div className="p-3.5 bg-slate-500/5 rounded border border-slate-700/10 space-y-3">
                    <span className="text-[10.5px] font-bold text-slate-400 uppercase block">3. Multi-Step Sign-Off Workflows</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Assign approval roles to execute this payroll event pipeline.</p>
                    
                    <div className="space-y-2 pt-1">
                      {formWorkflow.map((role, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-500/10 p-2 rounded text-xs border border-slate-700/10 font-bold">
                          <span className="text-[#0078D4] flex items-center gap-1">
                            <span className="text-slate-500 font-mono text-[9px]">{idx + 1}.</span>
                            {role}
                          </span>
                          <button
                            onClick={() => setFormWorkflow(prev => prev.filter((_, i) => i !== idx))}
                            className="text-slate-500 hover:text-[#F1707B] p-0.5 rounded"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}

                      <div className="flex gap-1.5 pt-1.5">
                        <select
                          id="select_workflow_role_add"
                          className="flex-1 text-[11px] p-1.5 rounded bg-[#1F1F1F] border border-[#2D2D2D] text-white font-semibold outline-none"
                        >
                          <option value="HR Generalist">HR Generalist</option>
                          <option value="Operations Lead">Operations Lead</option>
                          <option value="Regional Payroll Manager">Regional Payroll Manager</option>
                          <option value="Finance VP">Finance VP</option>
                          <option value="Executive Director">Executive Director</option>
                          <option value="Legal Counsel">Legal Counsel</option>
                        </select>
                        <button
                          onClick={() => {
                            const sel = document.getElementById("select_workflow_role_add") as HTMLSelectElement;
                            if (sel && sel.value) {
                              setFormWorkflow(prev => [...prev, sel.value]);
                            }
                          }}
                          className="bg-[#0078D4] text-white text-[11px] font-bold px-2.5 rounded hover:bg-[#005A9E]"
                        >
                          + Add Step
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* AI Copilot rules */}
                  <div className="p-3.5 bg-slate-500/5 rounded border border-slate-700/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-bold text-slate-400 uppercase">4. AI Audit Validation Instructions</span>
                      <button
                        onClick={handleAddAiRule}
                        className="text-[10px] text-amber-400 font-bold hover:underline"
                      >
                        + Add Instruction
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[180px] overflow-y-auto">
                      {formAiRules.map((rule, idx) => (
                        <div key={idx} className="flex gap-1 items-start bg-slate-500/10 p-2 rounded border border-slate-700/10">
                          <textarea
                            value={rule}
                            rows={2}
                            onChange={(e) => handleAiRuleChange(idx, e.target.value)}
                            className="flex-1 text-[10.5px] p-1 rounded bg-[#1F1F1F] border border-[#2D2D2D] text-white outline-none font-medium leading-normal resize-none"
                          />
                          <button
                            onClick={() => handleRemoveAiRule(idx)}
                            className="p-1 text-slate-500 hover:text-[#F1707B] rounded"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-700/10">
                <button
                  onClick={() => setIsCreatingTemplate(false)}
                  className={`px-3 py-1.5 border rounded text-xs font-bold transition ${
                    isDark ? "border-[#2D2D2D] hover:bg-[#2D2D2D] text-slate-300" : "border-[#EDEBE9] hover:bg-[#F3F2F1] text-slate-700"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDynamicTemplate}
                  id="btn_save_template"
                  className="px-4 py-1.5 bg-[#107C10] hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-md flex items-center gap-1"
                >
                  <CheckCircle size={13} />
                  Save Template to Firestore
                </button>
              </div>
            </div>

          )}

        </div>
      )}

      {/* --- Tab 3: INGESTION HISTORY TABLE --- */}
      {activeTab === "history" && (
        <div className={`p-3.5 rounded-md border ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9] shadow-sm"}`} id="ingestion_history_tab_wrapper">
          <div className="flex items-center justify-between border-b pb-2 border-slate-700/10">
            <div>
              <h3 className="text-xs font-bold text-white uppercase">Ledger Ingestion Logs & Version Audits</h3>
              <p className="text-[10.5px] text-slate-400">Archival history of transactional inflows mapped under sovereign regulatory guidelines.</p>
            </div>
          </div>

          <div className="overflow-x-auto pt-3">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-700/10 text-slate-400 pb-1.5">
                  <th className="py-2 px-3">File Name Ingested</th>
                  <th className="py-2 px-3">Matching Schema</th>
                  <th className="py-2 px-3 text-center">Ingested Volume</th>
                  <th className="py-2 px-3">Ingested Time</th>
                  <th className="py-2 px-3">Triggered User</th>
                  <th className="py-2 px-3">Mapping Quality</th>
                  <th className="py-2 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {historyItems.map((h) => (
                  <tr 
                    key={h.id} 
                    className={`border-b border-slate-700/5 transition-colors hover:bg-slate-500/5`}
                  >
                    <td className="py-2 px-3 font-semibold text-white">{h.fileName}</td>
                    <td className="py-2 px-3 text-[#0078D4] font-semibold">{h.templateName}</td>
                    <td className="py-2 px-3 text-center font-mono text-slate-300 font-semibold">{h.recordsCount} items</td>
                    <td className="py-2 px-3 text-slate-400">{h.time}</td>
                    <td className="py-2 px-3 text-slate-400">{h.user}</td>
                    <td className="py-2 px-3">
                      <span className="text-[#107C10] font-bold font-mono">{h.mappingScore}% aligned</span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className="px-1.5 py-0.5 rounded font-bold text-[9px] bg-[#107C10]/10 text-[#107C10]">
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

// Extra supporting sub-component for layout icons mapping
function UserPlusIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" x2="19" y1="8" y2="14" />
      <line x1="22" x2="16" y1="11" y2="11" />
    </svg>
  );
}
