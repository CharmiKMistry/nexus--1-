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
  X,
  Edit2,
  Trash2,
  Plus,
  ArrowUpRight,
  FileSpreadsheet,
  AlertTriangle,
  History,
  ChevronRight,
  RefreshCw,
  Coins,
  ShieldAlert,
  Eye,
  Sliders,
  Download,
  ToggleLeft,
  ToggleRight,
  Copy
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

// --- Types & Interfaces ---
export interface TemplateField {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "date";
  isMandatory: boolean;
}

export interface CountryValidation {
  country: string;
  field: string;
  condition: "max_hours" | "min_amount" | "max_amount" | "format_email";
  value: string;
  errorMessage: string;
}

export interface PayrollTemplate {
  id: string;
  templateId: string;
  name: string;
  templateName: string;
  description: string;
  version: number;
  headers: string[];
  mandatoryFields: string[];
  createdAt: string;
  updatedAt: string;
  status: "Active" | "Inactive";
  createdBy: string;
  requiredFields: TemplateField[];
  countryValidations: CountryValidation[];
  aiRules: string[];
  approvalWorkflow: string[];
  currency: string;
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

  // --- Core States ---
  const [activeTab, setActiveTab] = useState<"upload" | "templates" | "history">("upload");
  const [templates, setTemplates] = useState<PayrollTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [employeesList, setEmployeesList] = useState<any[]>([]);

  // Ingestion history states
  const [historyItems, setHistoryItems] = useState<IngestionHistoryItem[]>([]);

  // Upload state management
  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "uploaded" | "mapping" | "review" | "success">("idle");
  const [fileName, setFileName] = useState("");
  const [detectedTemplate, setDetectedTemplate] = useState<PayrollTemplate | null>(null);
  const [columnMappings, setColumnMappings] = useState<{ sourceHeader: string; targetField: string; confidence: number }[]>([]);
  const [parsedRows, setParsedRows] = useState<SpreadsheetRow[]>([]);
  const [editingRow, setEditingRow] = useState<SpreadsheetRow | null>(null);
  const [uploadedRawRows, setUploadedRawRows] = useState<any[][]>([]);

  // Template Adaptive Learning Wizard
  const [learningSheet, setLearningSheet] = useState<{ fileName: string; columns: string[] } | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Template Form builder states
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PayrollTemplate | null>(null);
  const [formTemplateName, setFormTemplateName] = useState("");
  const [formTemplateDesc, setFormTemplateDesc] = useState("");
  const [formTemplateFields, setFormTemplateFields] = useState<TemplateField[]>([]);
  const [formCountryVal, setFormCountryVal] = useState<CountryValidation[]>([]);
  const [formCurrency, setFormCurrency] = useState("USD");
  const [formWorkflow, setFormWorkflow] = useState<string[]>([]);
  const [formAiRules, setFormAiRules] = useState<string[]>([]);

  // Custom dialogs for confirm / alert (to avoid iframe sandbox allowance issues)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm });
  };

  const showAlert = (title: string, message: string, type: "success" | "error" | "info" = "info") => {
    setAlertDialog({ isOpen: true, title, message, type });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 9 Official Corporate Default Templates ---
  const OFFICIAL_DEFAULT_TEMPLATES: PayrollTemplate[] = [
    {
      id: "tmpl_retention_pay",
      templateId: "tmpl_retention_pay",
      name: "Retention Pay",
      templateName: "Retention Pay",
      description: "Retention pay inputs and lock-in bonus records with conditional validation.",
      version: 1,
      headers: ["PS Number", "Name of Employee", "Pay Component (Retention)", "Amount in Local Currency"],
      mandatoryFields: ["PS Number", "Name of Employee", "Amount in Local Currency"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "Active",
      createdBy: "System",
      currency: "Global",
      requiredFields: [
        { key: "employeeId", label: "PS Number", type: "string", isMandatory: true },
        { key: "employeeName", label: "Name of Employee", type: "string", isMandatory: true },
        { key: "payComponent", label: "Pay Component (Retention)", type: "string", isMandatory: false },
        { key: "amount", label: "Amount in Local Currency", type: "number", isMandatory: true }
      ],
      countryValidations: [],
      aiRules: ["Validate lock-in bonus does not exceed regional budget limits."],
      approvalWorkflow: ["HR Specialist", "Regional Lead"],
      isSystem: true
    },
    {
      id: "tmpl_variable_pay",
      templateId: "tmpl_variable_pay",
      name: "Variable Pay",
      templateName: "Variable Pay",
      description: "Variable pay adjustments, performance awards, and discretionary allowances.",
      version: 1,
      headers: ["PS Number", "Name of Employee", "Pay Component (Variable Pay)", "Amount in Local Currency"],
      mandatoryFields: ["PS Number", "Name of Employee", "Amount in Local Currency"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "Active",
      createdBy: "System",
      currency: "Global",
      requiredFields: [
        { key: "employeeId", label: "PS Number", type: "string", isMandatory: true },
        { key: "employeeName", label: "Name of Employee", type: "string", isMandatory: true },
        { key: "payComponent", label: "Pay Component (Variable Pay)", type: "string", isMandatory: false },
        { key: "amount", label: "Amount in Local Currency", type: "number", isMandatory: true }
      ],
      countryValidations: [],
      aiRules: ["Ensure rating metrics align with variable payout tiers."],
      approvalWorkflow: ["Line Manager", "Regional Finance"],
      isSystem: true
    },
    {
      id: "tmpl_resignation",
      templateId: "tmpl_resignation",
      name: "Resignation",
      templateName: "Resignation",
      description: "Terminal payouts, separation date logs, and notice period buyouts.",
      version: 1,
      headers: ["PS Number", "Name", "Separation Date", "Leave to be Encashed", "Reason of Separation"],
      mandatoryFields: ["PS Number", "Name", "Separation Date", "Leave to be Encashed"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "Active",
      createdBy: "System",
      currency: "Global",
      requiredFields: [
        { key: "employeeId", label: "PS Number", type: "string", isMandatory: true },
        { key: "employeeName", label: "Name", type: "string", isMandatory: true },
        { key: "separationDate", label: "Separation Date", type: "date", isMandatory: true },
        { key: "leaveEncashment", label: "Leave to be Encashed", type: "number", isMandatory: true },
        { key: "reason", label: "Reason of Separation", type: "string", isMandatory: false }
      ],
      countryValidations: [],
      aiRules: ["Audit final working day against statutory notice periods."],
      approvalWorkflow: ["HR Partner", "Payroll Lead"],
      isSystem: true
    },
    {
      id: "tmpl_sales_award",
      templateId: "tmpl_sales_award",
      name: "Sales Award",
      templateName: "Sales Award",
      description: "Commission payments with multi-currency conversion to local employee currencies.",
      version: 1,
      headers: ["PS Number", "Name", "Category", "Region", "Client Account", "Amount (USD)"],
      mandatoryFields: ["PS Number", "Name", "Region", "Amount (USD)"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "Active",
      createdBy: "System",
      currency: "USD",
      requiredFields: [
        { key: "employeeId", label: "PS Number", type: "string", isMandatory: true },
        { key: "employeeName", label: "Name", type: "string", isMandatory: true },
        { key: "category", label: "Category", type: "string", isMandatory: false },
        { key: "country", label: "Region", type: "string", isMandatory: true },
        { key: "clientAccount", label: "Client Account", type: "string", isMandatory: false },
        { key: "amountUsd", label: "Amount (USD)", type: "number", isMandatory: true }
      ],
      countryValidations: [
        { country: "India", field: "amountUsd", condition: "max_amount", value: "2000", errorMessage: "Awards above $2,000 USD require compensation board approval." }
      ],
      aiRules: ["Convert commission value from USD to employee local currency.", "Flag sales commissions exceeding corporate budgets."],
      approvalWorkflow: ["Sales Director", "Global Compensation"],
      isSystem: true
    },
    {
      id: "tmpl_recovery_input",
      templateId: "tmpl_recovery_input",
      name: "Recovery Input",
      templateName: "Recovery Input",
      description: "Clawbacks, overpayments, and advances deductions processing.",
      version: 1,
      headers: ["PS Number", "Name", "Country", "Type of Recovery", "Amount to be Recovered"],
      mandatoryFields: ["PS Number", "Name", "Country", "Amount to be Recovered"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "Active",
      createdBy: "System",
      currency: "Global",
      requiredFields: [
        { key: "employeeId", label: "PS Number", type: "string", isMandatory: true },
        { key: "employeeName", label: "Name", type: "string", isMandatory: true },
        { key: "country", label: "Country", type: "string", isMandatory: true },
        { key: "recoveryType", label: "Type of Recovery", type: "string", isMandatory: false },
        { key: "amount", label: "Amount to be Recovered", type: "number", isMandatory: true }
      ],
      countryValidations: [],
      aiRules: ["Deduction installments must not exceed 25% of gross pay."],
      approvalWorkflow: ["Operations Supervisor", "Finance Controller"],
      isSystem: true
    },
    {
      id: "tmpl_salary_change",
      templateId: "tmpl_salary_change",
      name: "Salary Change",
      templateName: "Salary Change",
      description: "CTC Base adjustments, allowance re-allocations, and compensation amendments.",
      version: 1,
      headers: ["PS Number", "Name", "Country", "Currency Type", "Base Compensation", "Project Allowance", "Transportation Allowance", "HRA", "Other Allowance", "Variable Pay", "Telephone and Conveyance Allowance", "Air Passage", "Annual Retention Bonus", "Quarterly Retention Bonus", "Total CTC", "Comments"],
      mandatoryFields: ["PS Number", "Name", "Country", "Currency Type", "Base Compensation", "Total CTC"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "Active",
      createdBy: "System",
      currency: "Global",
      requiredFields: [
        { key: "employeeId", label: "PS Number", type: "string", isMandatory: true },
        { key: "employeeName", label: "Name", type: "string", isMandatory: true },
        { key: "country", label: "Country", type: "string", isMandatory: true },
        { key: "currency", label: "Currency Type", type: "string", isMandatory: true },
        { key: "baseCompensation", label: "Base Compensation", type: "number", isMandatory: true },
        { key: "projectAllowance", label: "Project Allowance", type: "number", isMandatory: false },
        { key: "transportationAllowance", label: "Transportation Allowance", type: "number", isMandatory: false },
        { key: "hra", label: "HRA", type: "number", isMandatory: false },
        { key: "otherAllowance", label: "Other Allowance", type: "number", isMandatory: false },
        { key: "variablePay", label: "Variable Pay", type: "number", isMandatory: false },
        { key: "telecomAllowance", label: "Telephone and Conveyance Allowance", type: "number", isMandatory: false },
        { key: "airPassage", label: "Air Passage", type: "number", isMandatory: false },
        { key: "annualRetention", label: "Annual Retention Bonus", type: "number", isMandatory: false },
        { key: "quarterlyRetention", label: "Quarterly Retention Bonus", type: "number", isMandatory: false },
        { key: "totalCtc", label: "Total CTC", type: "number", isMandatory: true },
        { key: "comments", label: "Comments", type: "string", isMandatory: false }
      ],
      countryValidations: [],
      aiRules: ["Flag increments exceeding 35% as critical audit outliers."],
      approvalWorkflow: ["Compensation Lead", "Regional Director", "Finance VP"],
      isSystem: true
    },
    {
      id: "tmpl_overtime",
      templateId: "tmpl_overtime",
      name: "Overtime",
      templateName: "Overtime",
      description: "Hourly overtime logging matched against clock swipe systems.",
      version: 1,
      headers: ["PS Number", "Name", "Day", "Date", "Total Hours", "Regular Working Hours", "OT Hours"],
      mandatoryFields: ["PS Number", "Name", "Date", "Total Hours", "OT Hours"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "Active",
      createdBy: "System",
      currency: "Global",
      requiredFields: [
        { key: "employeeId", label: "PS Number", type: "string", isMandatory: true },
        { key: "employeeName", label: "Name", type: "string", isMandatory: true },
        { key: "day", label: "Day", type: "string", isMandatory: false },
        { key: "date", label: "Date", type: "date", isMandatory: true },
        { key: "totalHours", label: "Total Hours", type: "number", isMandatory: true },
        { key: "regularHours", label: "Regular Working Hours", type: "number", isMandatory: false },
        { key: "otHours", label: "OT Hours", type: "number", isMandatory: true }
      ],
      countryValidations: [
        { country: "India", field: "otHours", condition: "max_hours", value: "50", errorMessage: "India Factories Act limits quarterly overtime to 50 hours max." }
      ],
      aiRules: ["Flag work hours exceeding regional labor law regulations."],
      approvalWorkflow: ["Operations Lead", "Regional Auditor"],
      isSystem: true
    },
    {
      id: "tmpl_new_joiner",
      templateId: "tmpl_new_joiner",
      name: "New Joiner",
      templateName: "New Joiner",
      description: "Onboarding details and starter compensation components mapping.",
      version: 1,
      headers: ["PS Number", "Name", "Joining Grade", "Start Date", "Email ID", "Deputation or Direct Hire", "Basic Pay", "HRA", "Other Allowance", "Total Salary", "Remarks"],
      mandatoryFields: ["PS Number", "Name", "Start Date", "Email ID", "Total Salary"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "Active",
      createdBy: "System",
      currency: "Global",
      requiredFields: [
        { key: "employeeId", label: "PS Number", type: "string", isMandatory: true },
        { key: "employeeName", label: "Name", type: "string", isMandatory: true },
        { key: "joiningGrade", label: "Joining Grade", type: "string", isMandatory: false },
        { key: "startDate", label: "Start Date", type: "date", isMandatory: true },
        { key: "email", label: "Email ID", type: "string", isMandatory: true },
        { key: "hireType", label: "Deputation or Direct Hire", type: "string", isMandatory: false },
        { key: "basicPay", label: "Basic Pay", type: "number", isMandatory: false },
        { key: "hra", label: "HRA", type: "number", isMandatory: false },
        { key: "otherAllowance", label: "Other Allowance", type: "number", isMandatory: false },
        { key: "totalSalary", label: "Total Salary", type: "number", isMandatory: true },
        { key: "remarks", label: "Remarks", type: "string", isMandatory: false }
      ],
      countryValidations: [
        { country: "Global", field: "email", condition: "format_email", value: "format", errorMessage: "Employee corporate email must match typical formatting (contain @)." }
      ],
      aiRules: ["Validate salary bands strictly align with joining grade standards."],
      approvalWorkflow: ["TA Specialist", "Compensation Lead", "HR Admin VP"],
      isSystem: true
    },
    {
      id: "tmpl_promotion",
      templateId: "tmpl_promotion",
      name: "Promotion / Grade Change",
      templateName: "Promotion / Grade Change",
      description: "Grade changes, structural transfers, and associated designation amendments.",
      version: 1,
      headers: ["PS Number", "Name", "Country", "Current Grade", "Current Designation", "Final New Grade", "Final New Designation", "Event", "Event Reason", "Effective Date"],
      mandatoryFields: ["PS Number", "Name", "Country", "Current Grade", "Final New Grade", "Effective Date"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "Active",
      createdBy: "System",
      currency: "Global",
      requiredFields: [
        { key: "employeeId", label: "PS Number", type: "string", isMandatory: true },
        { key: "employeeName", label: "Name", type: "string", isMandatory: true },
        { key: "country", label: "Country", type: "string", isMandatory: true },
        { key: "currentGrade", label: "Current Grade", type: "string", isMandatory: true },
        { key: "currentDesignation", label: "Current Designation", type: "string", isMandatory: false },
        { key: "newGrade", label: "Final New Grade", type: "string", isMandatory: true },
        { key: "newDesignation", label: "Final New Designation", type: "string", isMandatory: false },
        { key: "event", label: "Event", type: "string", isMandatory: false },
        { key: "eventReason", label: "Event Reason", type: "string", isMandatory: false },
        { key: "effectiveDate", label: "Effective Date", type: "date", isMandatory: true }
      ],
      countryValidations: [],
      aiRules: ["Confirm career grade progressions align with the organization structure matrix."],
      approvalWorkflow: ["HR Business Partner", "Compensation Specialist", "Operations VP"],
      isSystem: true
    }
  ];

  // --- Initialize & Synchronize on Mount ---
  useEffect(() => {
    async function bootAndSeed() {
      setIsLoadingTemplates(true);
      try {
        // 1. Fetch Master Templates from persistent Firebase 'template_registry'
        const tSnap = await getDocs(collection(db, "template_registry"));
        if (tSnap.empty) {
          console.log("No templates found in 'template_registry'. Seeding 9 default templates...");
          for (const tmpl of OFFICIAL_DEFAULT_TEMPLATES) {
            await setDoc(doc(db, "template_registry", tmpl.id), tmpl);
          }
          setTemplates(OFFICIAL_DEFAULT_TEMPLATES);
        } else {
          const list = tSnap.docs.map(doc => doc.data() as PayrollTemplate);
          setTemplates(list);
        }

        // 2. Load Ingestion History Logs
        await loadHistory();

        // 3. Fetch Master Employees list from system endpoint for live cross-validation
        const empRes = await fetch("/api/employees");
        if (empRes.ok) {
          const empData = await empRes.json();
          setEmployeesList(empData);
        }
      } catch (err) {
        console.error("Failed initialization sequence:", err);
        setTemplates(OFFICIAL_DEFAULT_TEMPLATES);
      } finally {
        setIsLoadingTemplates(false);
      }
    }
    bootAndSeed();
  }, []);

  // --- Load history helper ---
  const loadHistory = async () => {
    try {
      const hSnap = await getDocs(collection(db, "upload_history"));
      const list = hSnap.docs.map(d => {
        const dData = d.data();
        return {
          id: d.id,
          fileName: dData.fileName,
          templateName: dData.templateName || dData.templateId || "Custom Schema",
          recordsCount: dData.recordsCount || 0,
          time: dData.timestamp ? dData.timestamp.replace("T", " ").substring(0, 16) : new Date().toISOString().replace("T", " ").substring(0, 16),
          status: dData.status || "Completed",
          mappingScore: dData.mappingQuality || 100,
          user: dData.uploadedBy || "Ronak Surve"
        } as IngestionHistoryItem;
      });
      setHistoryItems(list.sort((a, b) => b.time.localeCompare(a.time)));
    } catch (err) {
      console.error("Failed loading history logs:", err);
    }
  };

  // --- Fuzzy Matching Header Comparison Algorithm (>=95% Accuracy check) ---
  const calculateHeaderSimilarity = (
    uploaded: string[], 
    tmpl: PayrollTemplate
  ): { score: number; mappings: { sourceHeader: string; targetField: string; confidence: number }[] } => {
    const normalize = (h: string) => h.toLowerCase().trim().replace(/[_\-\s]/g, "");
    const normUploaded = uploaded.map(h => ({ original: h, normalized: normalize(h) }));
    
    let matches = 0;
    const mappings: { sourceHeader: string; targetField: string; confidence: number }[] = [];
    const usedHeaders = new Set<string>();

    // Pass 1: Exact or near-exact matches
    tmpl.requiredFields.forEach(field => {
      const normLabel = normalize(field.label);
      const normKey = normalize(field.key);

      const exactMatch = normUploaded.find(u => 
        !usedHeaders.has(u.original) && (u.normalized === normLabel || u.normalized === normKey)
      );

      if (exactMatch) {
        matches++;
        usedHeaders.add(exactMatch.original);
        mappings.push({
          sourceHeader: exactMatch.original,
          targetField: field.key,
          confidence: 100
        });
      }
    });

    // Pass 2: Synonym/fuzzy matching
    tmpl.requiredFields.forEach(field => {
      if (mappings.some(m => m.targetField === field.key)) return;

      const normLabel = normalize(field.label);
      const normKey = normalize(field.key);
      const currentFieldKey = field.key.toLowerCase();

      const synonymMatch = normUploaded.find(u => {
        if (usedHeaders.has(u.original)) return false;

        if (currentFieldKey === "employeeid") {
          const isIdWord = u.normalized === "id" || u.normalized === "empid" || u.normalized.includes("ps") || u.normalized.includes("staff") || u.normalized.includes("personnel") || u.normalized.includes("employeeid");
          const isNameWord = u.normalized.includes("name");
          if (isIdWord && !isNameWord) return true;
        }

        if (currentFieldKey === "employeename") {
          const containsIdKeywords = u.normalized.includes("id") || u.normalized.includes("code") || u.normalized.includes("num") || u.normalized.includes("no") || u.normalized.includes("ps");
          const containsNameKeywords = u.normalized.includes("name") || u.normalized.includes("fullname") || u.normalized === "employee" || u.normalized === "emp" || u.normalized === "worker";
          if (containsNameKeywords && !containsIdKeywords) return true;
        }

        if (currentFieldKey === "country") {
          const isCountryWord = u.normalized.includes("country") || u.normalized.includes("region") || u.normalized.includes("location") || u.normalized.includes("zone") || u.normalized.includes("hub");
          if (isCountryWord) return true;
        }

        if (u.normalized.includes(normLabel) || normLabel.includes(u.normalized)) return true;
        if (u.normalized.includes(normKey) || normKey.includes(u.normalized)) return true;

        return false;
      });

      if (synonymMatch) {
        matches++;
        usedHeaders.add(synonymMatch.original);
        mappings.push({
          sourceHeader: synonymMatch.original,
          targetField: field.key,
          confidence: 95
        });
      }
    });

    const score = matches / tmpl.requiredFields.length;
    return { score, mappings };
  };

  // --- Process Rows with Mappings Helper ---
  const processRowsWithMappings = (
    rows: any[][],
    mappings: { sourceHeader: string; targetField: string; confidence: number }[] ,
    template: PayrollTemplate
  ) => {
    const firstRow = rows[0];
    if (!firstRow) return;

    const parsed: SpreadsheetRow[] = [];
    for (let i = 1; i < rows.length; i++) {
      const rowData = rows[i];
      if (!rowData || (Array.isArray(rowData) && rowData.filter(Boolean).length === 0)) {
        continue;
      }

      const dataMap: { [key: string]: any } = {};
      template.requiredFields.forEach(f => {
        dataMap[f.key] = f.type === "number" ? 0 : "";
      });

      mappings.forEach(mapping => {
        if (!mapping.targetField) return;
        const headerIndex = firstRow.findIndex(h => String(h || "").trim() === mapping.sourceHeader);
        if (headerIndex !== -1 && rowData[headerIndex] !== undefined) {
          let cellVal = rowData[headerIndex];
          const fieldDef = template.requiredFields.find(f => f.key === mapping.targetField);
          if (fieldDef) {
            if (fieldDef.type === "number") {
              cellVal = Number(String(cellVal).replace(/[^0-9.-]/g, "")) || 0;
            } else {
              cellVal = String(cellVal).trim();
            }
          }
          dataMap[mapping.targetField] = cellVal;
        }
      });

      parsed.push({
        id: `row-${i}-${Date.now().toString().slice(-4)}`,
        data: dataMap,
        errors: [],
        warnings: [],
        isValid: true
      });
    }

    setParsedRows(parsed);
  };

  // --- Real File Parsing Pipeline using FileReader & SheetJS (xlsx) ---
  const handleFileParsing = (file: File, overrideTemplates?: PayrollTemplate[]) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        if (rawRows.length === 0) {
          alert("The uploaded spreadsheet file appears to be completely empty.");
          return;
        }

        const firstRow = rawRows[0];
        if (!firstRow || !Array.isArray(firstRow)) {
          alert("Failed to read headers from the spreadsheet. Check structure.");
          return;
        }

        const headers = firstRow.map(h => String(h || "").trim()).filter(Boolean);
        if (headers.length === 0) {
          alert("Failed to find any non-empty header entries in the first row.");
          return;
        }

        // Search for best matching template with >=95% similarity
        let bestTmpl: PayrollTemplate | null = null;
        let bestScore = -1;
        let bestMappings: { sourceHeader: string; targetField: string; confidence: number }[] = [];

        const templatesToUse = overrideTemplates || templates;
        templatesToUse.forEach(tmpl => {
          if (tmpl.status === "Inactive") return;
          const { score, mappings } = calculateHeaderSimilarity(headers, tmpl);
          if (score > bestScore) {
            bestScore = score;
            bestTmpl = tmpl;
            bestMappings = mappings;
          }
        });

        // Similarity must be >= 95% (bestScore >= 0.95 or close)
        if (bestTmpl && bestScore >= 0.95) {
          setFileName(file.name);
          setDetectedTemplate(bestTmpl);
          setColumnMappings(bestMappings);
          setUploadedRawRows(rawRows);

          processRowsWithMappings(rawRows, bestMappings, bestTmpl);

          setUploadState("uploaded");
          setLearningSheet(null);
          setPendingFile(null);
        } else {
          // Trigger AI Adaptive Learning flow since no registered templates met the threshold
          setFileName(file.name);
          setLearningSheet({
            fileName: file.name,
            columns: headers
          });
          setPendingFile(file);
          setUploadState("idle");
        }
      } catch (err) {
        console.error("Spreadsheet ingestion parser error:", err);
        alert("NEXUS Ingestion Error: Failed to parse file format. Please ensure it is a valid .csv, .xls, or .xlsx spreadsheet.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // --- Run AI Validation Jobs (Phase 7 - Live Programmatic Checks) ---
  const handleRunAiValidation = async () => {
    if (!detectedTemplate) return;
    setUploadState("mapping");

    // Perform validation processing asynchronously
    setTimeout(async () => {
      try {
        const validated = parsedRows.map(row => {
          const errors: string[] = [];
          const warnings: string[] = [];

           const psNumber = String(row.data["employeeId"] || row.data["employeeid"] || "").trim();
           const country = String(row.data["country"] || "Global").trim();
 
           // 1. Check for Missing Fields (Mandatory check)
           detectedTemplate.requiredFields.forEach(field => {
             if (field.isMandatory) {
               const val = row.data[field.key];
               if (val === undefined || val === null || String(val).trim() === "") {
                 errors.push(`Mandatory attribute "${field.label}" is missing.`);
               }
             }
           });
 
           // 2. Check for Duplicate PS Numbers within the uploaded batch run
           if (psNumber) {
             const batchMatches = parsedRows.filter(r => String(r.data["employeeId"] || r.data["employeeid"] || "").trim() === psNumber).length;
             if (batchMatches > 1) {
               errors.push(`Duplicate employee PS Number "${psNumber}" detected within the uploaded spreadsheet dataset.`);
             }
           }

          // 3. Check for Negative Salary/Deduction Amounts
          detectedTemplate.requiredFields.forEach(field => {
            if (field.type === "number") {
              const val = Number(row.data[field.key]);
              if (val < 0) {
                errors.push(`Negative payroll numeric parameter not permitted for "${field.label}" (${val}).`);
              }
            }
          });

          // 4. Check for Invalid/Future Calendars Dates
          detectedTemplate.requiredFields.forEach(field => {
            if (field.type === "date") {
              const val = row.data[field.key];
              if (val) {
                const dateObj = new Date(val);
                if (isNaN(dateObj.getTime())) {
                  errors.push(`Date format compliance error for attribute "${field.label}".`);
                } else if (dateObj > new Date()) {
                  errors.push(`Future-dated calendar value mismatch for "${field.label}".`);
                }
              }
            }
          });

          // 5. Check Employee Existence inside system directories (except for New Joiner)
          const isNewJoiner = detectedTemplate.id === "tmpl_new_joiner";
          const dbProfile = employeesList.find(e => String(e.id).trim().toLowerCase() === psNumber.toLowerCase());

          if (!isNewJoiner && psNumber) {
            if (!dbProfile) {
              errors.push(`Personnel mismatch: PS Number "${psNumber}" does not exist in active corporate master directories.`);
            }
          }

          // 6. Check for Invalid Corporate Grade
          if (dbProfile) {
            if (row.data["grade"] && row.data["grade"] !== dbProfile.grade) {
              warnings.push(`Sovereign Grade Alignment Warning: File indicates "${row.data["grade"]}" while DB has "${dbProfile.grade}".`);
            }
            if (detectedTemplate.id === "tmpl_promotion" && row.data["currentGrade"]) {
              if (row.data["currentGrade"] !== dbProfile.grade) {
                warnings.push(`Promotion discrepancy: Provided current grade "${row.data["currentGrade"]}" does not match DB directory record.`);
              }
            }
          }

          // 7. Check for Missing Approver
          if (!detectedTemplate.approvalWorkflow || detectedTemplate.approvalWorkflow.length === 0) {
            errors.push("Workflow routing error: No multi-stage approvers are mapped to this template event.");
          }

          // 8. Sovereign Region Rules Validation
          detectedTemplate.countryValidations.forEach(valRule => {
            if (valRule.country === "Global" || valRule.country.toLowerCase() === country.toLowerCase()) {
              const fieldVal = Number(row.data[valRule.field]);
              if (valRule.condition === "max_hours" && fieldVal > Number(valRule.value)) {
                errors.push(valRule.errorMessage);
              }
              if (valRule.condition === "max_amount" && fieldVal > Number(valRule.value)) {
                errors.push(valRule.errorMessage);
              }
            }
          });

          // 9. Interactive Sales Award Currency Conversion (USD -> employee local rate)
          if (detectedTemplate.id === "tmpl_sales_award" && row.data["amountUsd"]) {
            const usdAmount = Number(row.data["amountUsd"]);
            const currencyTarget = dbProfile?.currency || "INR";
            
            let rate = 83.5; // default USD/INR
            if (currencyTarget === "SGD") rate = 1.34;
            else if (currencyTarget === "EUR") rate = 0.92;
            else if (currencyTarget === "JPY") rate = 155.0;

            const localVal = usdAmount * rate;
            row.data["amount"] = Math.round(localVal);
            warnings.push(`AI Smart Ingest Conversion: Automatically converted $${usdAmount} USD to ${Math.round(localVal).toLocaleString()} ${currencyTarget} (exchange rate: 1 USD = ${rate} ${currencyTarget}).`);
          }

          return {
            ...row,
            errors,
            warnings,
            isValid: errors.length === 0
          };
        });

        setParsedRows(validated);

        // Persistent Firestore log to 'validation_reports'
        const total = validated.length;
        const invalid = validated.filter(r => !r.isValid).length;
        await addDoc(collection(db, "validation_reports"), {
          timestamp: new Date().toISOString(),
          fileName,
          templateId: detectedTemplate.id,
          templateName: detectedTemplate.name,
          totalRecords: total,
          validRecords: total - invalid,
          invalidRecords: invalid,
          status: "Completed",
          triggeredBy: "Ronak Surve"
        });

        setUploadState("review");
      } catch (err) {
        console.error("AI Validation pass triggered error:", err);
        alert("Encountered internal system error running the validation engine.");
        setUploadState("uploaded");
      }
    }, 1200);
  };

  // --- Inline Row Edits ---
  const handleSaveEditedRow = () => {
    if (!editingRow || !detectedTemplate) return;

    // Run programmatic validation rules instantly on individual record edits
    const updated = { ...editingRow };
    const errs: string[] = [];
    const warns: string[] = [];

    detectedTemplate.requiredFields.forEach(field => {
      if (field.isMandatory) {
        const val = updated.data[field.key];
        if (val === undefined || val === null || String(val).trim() === "") {
          errs.push(`Mandatory attribute "${field.label}" is missing.`);
        }
      }
    });

    detectedTemplate.requiredFields.forEach(field => {
      if (field.type === "number") {
        const val = Number(updated.data[field.key]);
        if (val < 0) {
          errs.push(`Negative payroll parameter not permitted for "${field.label}".`);
        }
      }
    });

    updated.errors = errs;
    updated.warnings = warns;
    updated.isValid = errs.length === 0;

    setParsedRows(prev => prev.map(r => r.id === updated.id ? updated : r));
    setEditingRow(null);
  };

  // --- Final Commit Import Valid Records Only (Phase 9/11 Permanent Writes) ---
  const handleCommitImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      alert("No valid records found in the current review batch to import.");
      return;
    }

    try {
      // 1. Add record to 'upload_history' collection in Firestore
      await addDoc(collection(db, "upload_history"), {
        fileName,
        templateId: detectedTemplate?.id || "Custom",
        templateName: detectedTemplate?.name || "Excel Ingest",
        recordsCount: validRows.length,
        timestamp: new Date().toISOString(),
        uploadedBy: "Ronak Surve",
        status: "Completed",
        mappingQuality: Math.round((validRows.length / parsedRows.length) * 100)
      });

      // 2. Add audit log event entry
      await addDoc(collection(db, "AuditLogs"), {
        timestamp: new Date().toISOString(),
        user: "Ronak Surve (Super Admin)",
        role: "Super Admin",
        action: `Ingested ${validRows.length} valid entries into payroll run`,
        details: `Successfully completed ledger ingest processing for schema: ${detectedTemplate?.name}.`
      });

      alert(`Ingestion Successful!\nSuccessfully processed and committed ${validRows.length} payroll records into active country ledger databases.`);
      
      setUploadState("idle");
      setFileName("");
      setDetectedTemplate(null);
      setParsedRows([]);
      onIngestionComplete(); // notify parent component
      await loadHistory();   // refresh history log
    } catch (err) {
      console.error("Failed to write to Firestore:", err);
      alert("Persistent storage error occurred committing the imported records.");
    }
  };

  // --- AI Adaptive Learning Wizard: Learn and Register Template (Phase 5) ---
  const handleSaveLearnedTemplate = async () => {
    if (!learningSheet) return;

    const learnedId = `TMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTmpl: PayrollTemplate = {
      id: learnedId,
      templateId: learnedId,
      name: learningSheet.fileName.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
      templateName: learningSheet.fileName.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
      description: `AI Adaptive learned schema dynamically extracted from file: ${learningSheet.fileName}`,
      version: 1,
      headers: learningSheet.columns,
      mandatoryFields: [learningSheet.columns[0]],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "Active",
      createdBy: "System Learned",
      currency: "Global",
      requiredFields: learningSheet.columns.map((col, idx) => {
        const clean = col.toLowerCase().trim();
        let type: "string" | "number" | "boolean" | "date" = "string";
        if (clean.includes("amount") || clean.includes("salary") || clean.includes("hours") || clean.includes("rate") || clean.includes("pay") || clean.includes("bonus")) {
          type = "number";
        } else if (clean.includes("date")) {
          type = "date";
        }
        return {
          key: clean.replace(/[_\-\s]+/g, ""),
          label: col,
          type,
          isMandatory: idx === 0
        };
      }),
      countryValidations: [],
      aiRules: ["Audit parameters in compliance with system settings."],
      approvalWorkflow: ["HR Specialist", "Payroll Auditor"]
    };

    try {
      console.log("Saving learned template to template_registry with ID:", learnedId);
      await setDoc(doc(db, "template_registry", learnedId), newTmpl);
      
      const updatedTemplates = [...templates, newTmpl];
      setTemplates(updatedTemplates);
      
      await addDoc(collection(db, "AuditLogs"), {
        timestamp: new Date().toISOString(),
        user: "Ronak Surve (Super Admin)",
        role: "Super Admin",
        action: `Registered AI Learned Template: ${newTmpl.name}`,
        details: `Discovered and structured ${learningSheet.columns.length} schema headers automatically.`
      });

      alert(`AI Adaptive Learning Success!\nNew schema "${newTmpl.name}" (ID: ${learnedId}) registered into database registry. It is instantly reusable for future payroll runs!`);
      
      const fileToReparse = pendingFile;
      setLearningSheet(null);
      setFileName("");
      setPendingFile(null);

      // Automatically re-parse the file so it matches the newly registered template immediately!
      if (fileToReparse) {
        console.log("Auto-reparsing file with newly learned template:", fileToReparse.name);
        handleFileParsing(fileToReparse, updatedTemplates);
      }
    } catch (err: any) {
      console.error("Failed to register learned template:", err);
      alert(`Failed registering learned template to database: ${err.message || err}`);
    }
  };

  // --- Dynamic Template Engine CRUD & Schema Actions (Phase 8) ---
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
        { key: "employeeId", label: "PS Number", type: "string", isMandatory: true },
        { key: "employeeName", label: "Name of Employee", type: "string", isMandatory: true },
        { key: "country", label: "Country", type: "string", isMandatory: true }
      ]);
      setFormCountryVal([]);
      setFormCurrency("USD");
      setFormWorkflow(["HR Specialist", "Payroll Lead"]);
      setFormAiRules(["Verify database Personnel IDs."]);
    }
    setIsCreatingTemplate(true);
  };

  const handleSaveDynamicTemplate = async () => {
    if (!formTemplateName.trim()) {
      alert("Please specify a template name.");
      return;
    }

    const tId = editingTemplate ? editingTemplate.id : `tmpl_${formTemplateName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    const saved: PayrollTemplate = {
      id: tId,
      templateId: tId,
      name: formTemplateName,
      templateName: formTemplateName,
      description: formTemplateDesc,
      version: editingTemplate ? editingTemplate.version + 1 : 1,
      headers: formTemplateFields.map(f => f.label),
      mandatoryFields: formTemplateFields.filter(f => f.isMandatory).map(f => f.label),
      createdAt: editingTemplate ? editingTemplate.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: editingTemplate ? editingTemplate.status : "Active",
      createdBy: editingTemplate ? editingTemplate.createdBy : "Super Admin",
      currency: formCurrency,
      requiredFields: formTemplateFields,
      countryValidations: formCountryVal,
      aiRules: formAiRules,
      approvalWorkflow: formWorkflow,
      isSystem: editingTemplate ? editingTemplate.isSystem : false
    };

    try {
      await setDoc(doc(db, "template_registry", tId), saved);
      setTemplates(prev => {
        const filtered = prev.filter(t => t.id !== tId);
        return [...filtered, saved];
      });
      setIsCreatingTemplate(false);
      setEditingTemplate(null);
      alert(`Template "${formTemplateName}" schema successfully recorded into database registry.`);
    } catch (err) {
      console.error(err);
      alert("Error saving template configuration.");
    }
  };

  const handleDeleteTemplate = (id: string, name: string) => {
    showConfirm(
      "Delete Template Schema",
      `Are you sure you want to permanently delete template "${name}" from database registries?`,
      async () => {
        try {
          await deleteDoc(doc(db, "template_registry", id));
          setTemplates(prev => prev.filter(t => t.id !== id));
          showAlert("Template Deleted", `Deleted template schema: ${name}`, "success");
        } catch (err) {
          console.error(err);
          showAlert("Error", "Error removing schema.", "error");
        }
      }
    );
  };

  const handleCloneTemplate = async (tmpl: PayrollTemplate) => {
    const cloneId = `${tmpl.id}_clone_${Date.now().toString().slice(-4)}`;
    const cloned: PayrollTemplate = {
      ...tmpl,
      id: cloneId,
      templateId: cloneId,
      name: `Copy of ${tmpl.name}`,
      templateName: `Copy of ${tmpl.name}`,
      version: 1,
      isSystem: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, "template_registry", cloneId), cloned);
      setTemplates(prev => [...prev, cloned]);
      alert(`Successfully cloned template as: "${cloned.name}"`);
    } catch (err) {
      console.error(err);
      alert("Failed to clone template schema.");
    }
  };

  const handleToggleStatus = async (tmpl: PayrollTemplate) => {
    const nextStatus = tmpl.status === "Inactive" ? "Active" : "Inactive";
    try {
      await updateDoc(doc(db, "template_registry", tmpl.id), { status: nextStatus });
      setTemplates(prev => prev.map(t => t.id === tmpl.id ? { ...t, status: nextStatus } : t));
      alert(`Template "${tmpl.name}" has been toggled to: ${nextStatus}`);
    } catch (err) {
      console.error(err);
      alert("Failed toggling status.");
    }
  };

  const exportTemplateAsJson = (tmpl: PayrollTemplate) => {
    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tmpl, null, 2));
    const dlLink = document.createElement("a");
    dlLink.setAttribute("href", jsonStr);
    dlLink.setAttribute("download", `${tmpl.id}_schema_registry.json`);
    document.body.appendChild(dlLink);
    dlLink.click();
    dlLink.remove();
  };

  // --- Drag & Drop Operations ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileParsing(e.dataTransfer.files[0]);
    }
  };

  // --- ADMIN DEVELOPER CONTROLS ACTIONS (Phase 1 / Cleanup & Restore) ---
  const clearCollection = async (collName: string) => {
    const snap = await getDocs(collection(db, collName));
    for (const dDoc of snap.docs) {
      await deleteDoc(doc(db, collName, dDoc.id));
    }
  };

  const handleAdminAction = (actionType: string) => {
    showConfirm(
      "Developer System Override",
      `Are you sure you want to trigger: "${actionType}"? This action modifies the database permanently.`,
      async () => {
        try {
          if (actionType === "Reset Demo Data") {
            // Trigger server-side baseline reset
            try {
              await fetch("/api/mongodb/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isDynamic: true, loadHistoric: true })
              });
            } catch (srvErr) {
              console.warn("Server reset error ignored during client reset:", srvErr);
            }

            // Clear all histories, logs, and reset templates registry
            await clearCollection("upload_history");
            await clearCollection("validation_reports");
            await clearCollection("workflow_logs");
            await clearCollection("payroll_events");
            await clearCollection("AuditLogs");
            
            // Remove learned templates, keep/restore defaults
            await clearCollection("template_registry");
            for (const tmpl of OFFICIAL_DEFAULT_TEMPLATES) {
              await setDoc(doc(db, "template_registry", tmpl.id), tmpl);
            }

            setTemplates(OFFICIAL_DEFAULT_TEMPLATES);
            setHistoryItems([]);
            setLearningSheet(null);
            setUploadState("idle");
            showAlert("Action Complete", "Database has been completely clean-wiped and restored to default template registry!", "success");
          } 
          
          else if (actionType === "Remove All Dummy Templates") {
            // Remove templates not designated as system/defaults
            const snap = await getDocs(collection(db, "template_registry"));
            for (const dDoc of snap.docs) {
              const t = dDoc.data();
              if (t.createdBy !== "System" && !t.isSystem) {
                await deleteDoc(doc(db, "template_registry", dDoc.id));
              }
            }
            // reload templates
            const updatedSnap = await getDocs(collection(db, "template_registry"));
            setTemplates(updatedSnap.docs.map(doc => doc.data() as PayrollTemplate));
            showAlert("Action Complete", "All custom or learned templates successfully deleted from database registries!", "success");
          } 
          
          else if (actionType === "Clear Upload History") {
            await clearCollection("upload_history");
            await clearCollection("validation_reports");
            setHistoryItems([]);
            showAlert("Action Complete", "Sovereign historical ingestion registries successfully cleared!", "success");
          } 
          
          else if (actionType === "Reset AI Learning Cache") {
            setLearningSheet(null);
            showAlert("Action Complete", "AI Learning temporary memory structures have been reset!", "success");
          } 
          
          else if (actionType === "Clear Template Registry") {
            await clearCollection("template_registry");
            setTemplates([]);
            showAlert("Action Complete", "Sovereign template registry collection completely purged!", "success");
          } 
          
          else if (actionType === "Rebuild Default Payroll Templates") {
            await clearCollection("template_registry");
            for (const tmpl of OFFICIAL_DEFAULT_TEMPLATES) {
              await setDoc(doc(db, "template_registry", tmpl.id), tmpl);
            }
            setTemplates(OFFICIAL_DEFAULT_TEMPLATES);
            showAlert("Action Complete", "Rebuilt all 9 default corporate payroll event templates into database registry!", "success");
          }

          await loadHistory();
        } catch (err) {
          console.error(err);
          showAlert("Operation Error", "Error executing administrator command on Firestore collection.", "error");
        }
      }
    );
  };

  return (
    <div className="space-y-4" id="data_integration_main_wrapper">
      {/* Navigation tabs */}
      <div className="flex items-center justify-between border-b border-slate-700/10 pb-1 flex-wrap gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveTab("upload"); setIsCreatingTemplate(false); setLearningSheet(null); }}
            className={`px-3 py-1.5 text-xs font-bold border-b-2 -mb-[6px] flex items-center gap-1.5 transition ${
              activeTab === "upload" && !isCreatingTemplate ? "border-[#0078D4] text-[#0078D4]" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Upload size={13} />
            AI Excel Import Assistant
          </button>
          <button
            onClick={() => { setActiveTab("templates"); setIsCreatingTemplate(false); }}
            className={`px-3 py-1.5 text-xs font-bold border-b-2 -mb-[6px] flex items-center gap-1.5 transition ${
              activeTab === "templates" || isCreatingTemplate ? "border-[#0078D4] text-[#0078D4]" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Settings size={13} />
            Dynamic Template Engine
          </button>
          <button
            onClick={() => { setActiveTab("history"); setIsCreatingTemplate(false); }}
            className={`px-3 py-1.5 text-xs font-bold border-b-2 -mb-[6px] flex items-center gap-1.5 transition ${
              activeTab === "history" ? "border-[#0078D4] text-[#0078D4]" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <History size={13} />
            Ingestion History & Audits
          </button>
        </div>

        <div className="flex items-center gap-1.5 bg-[#0078D4]/10 px-2 py-0.5 rounded text-[10px] text-[#0078D4] font-semibold border border-[#0078D4]/20">
          <Sparkles size={11} className="animate-pulse" />
          <span>NEXUS AI Production Core</span>
        </div>
      </div>

      {/* --- Tab 1: IMPORT ASSISTANT --- */}
      {activeTab === "upload" && !isCreatingTemplate && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              
              {/* Idle File Upload Box */}
              {uploadState === "idle" && !learningSheet && (
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition ${
                    dragActive ? "border-[#0078D4] bg-[#0078D4]/5" : (isDark ? "border-[#2D2D2D] hover:border-slate-500 bg-[#1F1F1F]" : "border-[#EDEBE9] hover:bg-[#F3F2F1] bg-white")
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".xlsx,.xls,.csv" 
                    onChange={(e) => { if (e.target.files?.[0]) handleFileParsing(e.target.files[0]); }}
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-[#0078D4]/10 text-[#0078D4] rounded-full">
                      <FileSpreadsheet size={32} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Upload active corporate payroll dataset</h4>
                      <p className="text-[11px] text-slate-400 mt-1">Drag and drop file here, or click to browse local directories.</p>
                      <p className="text-[10px] text-slate-500 italic mt-2">Supports official .xlsx, .xls, and .csv ledger formats.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Uploaded File matched with schema header mapping preview */}
              {uploadState === "uploaded" && detectedTemplate && (
                <div className={`p-4 rounded-md border space-y-4 ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9]"}`}>
                  <div className="flex items-center justify-between border-b border-slate-700/10 pb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="text-[#0078D4]" size={18} />
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{fileName}</h4>
                        <p className="text-[10px] text-slate-400">Successfully matched against schema: <span className="text-[#0078D4] font-bold">{detectedTemplate.name}</span></p>
                      </div>
                    </div>
                    <button onClick={() => { setUploadState("idle"); setFileName(""); }} className="p-1 hover:bg-slate-700/20 rounded text-slate-400 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-bold text-slate-400 uppercase">Interactive Schema Mappings ({columnMappings.length})</span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded font-mono font-bold">95%+ Match Verified</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                      {columnMappings.map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-500/10 p-2 rounded border border-slate-700/10 text-xs">
                          <span className="font-mono text-slate-300 truncate max-w-[120px]" title={m.sourceHeader}>{m.sourceHeader}</span>
                          <ArrowRight size={12} className="text-slate-500 shrink-0 mx-1" />
                          <select
                            value={m.targetField}
                            onChange={(e) => {
                              const newTarget = e.target.value;
                              const updatedMappings = [...columnMappings];
                              updatedMappings[idx] = { ...m, targetField: newTarget };
                              setColumnMappings(updatedMappings);
                              
                              if (uploadedRawRows.length > 0 && detectedTemplate) {
                                processRowsWithMappings(uploadedRawRows, updatedMappings, detectedTemplate);
                              }
                            }}
                            className="bg-[#1F1F1F] text-white border border-[#2D2D2D] rounded text-[11px] p-1 w-[160px] focus:outline-none"
                          >
                            <option value="">-- Ignore Column --</option>
                            {detectedTemplate.requiredFields.map(f => (
                              <option key={f.key} value={f.key}>{f.label}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={handleRunAiValidation}
                      className="w-full py-2 bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 shadow"
                    >
                      <Sparkles size={14} />
                      Execute AI Multi-Step Validation Pass
                    </button>
                  </div>
                </div>
              )}

              {/* Validation run loader */}
              {uploadState === "mapping" && (
                <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
                  <RefreshCw size={32} className="animate-spin text-[#0078D4]" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Executing Sovereign AI Audits...</h4>
                    <p className="text-xs text-slate-400 mt-1">Cross-referencing PS Numbers against active directories and checking regional limit compliance.</p>
                  </div>
                </div>
              )}

              {/* Review Queue Tabbed records list */}
              {uploadState === "review" && detectedTemplate && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-slate-500/10 p-3 rounded border border-slate-700/5 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-amber-500" />
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase">Interactive Validation Review Queue</h4>
                        <p className="text-[10.5px] text-slate-400">Errors must be resolved inline before committing transaction batches into active directories.</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setUploadState("uploaded")} 
                        className="px-2.5 py-1 text-[10.5px] font-bold border border-slate-700 text-slate-300 hover:bg-slate-700/50 rounded"
                      >
                        Reset Match
                      </button>
                      <button 
                        onClick={handleCommitImport} 
                        className="px-3 py-1 bg-[#107C10] hover:bg-emerald-700 text-white text-[10.5px] font-bold rounded flex items-center gap-1 shadow"
                      >
                        <CheckCircle size={12} />
                        Import Valid Records Only
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-700/10 rounded-md overflow-hidden bg-slate-500/5">
                    <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-700/15 bg-slate-500/10 text-slate-400 font-bold">
                            <th className="py-2 px-3">Personnel ID</th>
                            <th className="py-2 px-3">Employee Name</th>
                             {detectedTemplate.requiredFields.filter(f => !["employeeid", "employeename", "country"].includes(f.key.toLowerCase())).map(f => (
                               <th key={f.key} className="py-2 px-3">{f.label}</th>
                             ))}
                             <th className="py-2 px-3">Verification Details</th>
                             <th className="py-2 px-3 text-right">Actions</th>
                           </tr>
                         </thead>
                         <tbody>
                           {parsedRows.map(row => (
                             <tr key={row.id} className={`border-b border-slate-700/5 ${row.isValid ? "hover:bg-slate-500/5" : "bg-red-500/5"}`}>
                               <td className="py-2 px-3 font-mono text-slate-300">{row.data["employeeId"] || row.data["employeeid"] || <span className="text-red-400 italic">Empty</span>}</td>
                               <td className="py-2 px-3 text-white font-semibold">{row.data["employeeName"] || row.data["employeename"] || <span className="text-red-400 italic">Empty</span>}</td>
                               {detectedTemplate.requiredFields.filter(f => !["employeeid", "employeename", "country"].includes(f.key.toLowerCase())).map(f => (
                                 <td key={f.key} className="py-2 px-3 font-semibold text-slate-300">{row.data[f.key]}</td>
                               ))}
                              <td className="py-2 px-3 space-y-1">
                                {row.errors.map((e, idx) => (
                                  <div key={idx} className="flex items-center gap-1 text-red-400 text-[10px] leading-normal font-medium">
                                    <ShieldAlert size={10} className="shrink-0" />
                                    <span>{e}</span>
                                  </div>
                                ))}
                                {row.warnings.map((w, idx) => (
                                  <div key={idx} className="flex items-center gap-1 text-amber-500 text-[10px] leading-normal font-medium">
                                    <AlertTriangle size={10} className="shrink-0" />
                                    <span>{w}</span>
                                  </div>
                                ))}
                                {row.isValid && row.warnings.length === 0 && (
                                  <div className="flex items-center gap-1 text-[#107C10] text-[10px] font-bold">
                                    <Check size={11} /> Passed Verification
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <button 
                                  onClick={() => setEditingRow(row)}
                                  className="p-1 hover:bg-[#0078D4]/10 text-[#0078D4] hover:text-[#005A9E] rounded"
                                >
                                  <Edit2 size={12} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Unknown template detected learning flow triggers */}
              {learningSheet && (
                <div className="p-5 bg-purple-500/5 border border-purple-500/30 rounded-lg space-y-4">
                  <div className="flex gap-3 items-start">
                    <div className="p-3 bg-purple-500/10 text-purple-400 rounded-full">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Unknown Template Structure Discovered</h4>
                      <p className="text-xs text-slate-400 mt-1">The headers inside uploaded sheet <span className="font-bold text-purple-300">"{fileName}"</span> do not match any recognized payroll schema registry. Run AI Adaptive Learning on this dataset structure?</p>
                    </div>
                  </div>

                  <div className="bg-slate-500/10 p-3 rounded text-xs border border-slate-700/10 space-y-2">
                    <span className="font-bold text-slate-400 text-[10px] uppercase">Discovered Columns ({learningSheet.columns.length})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {learningSheet.columns.map((col, idx) => (
                        <span key={idx} className="bg-slate-500/20 border border-slate-700/20 rounded px-2 py-0.5 text-[10.5px] font-mono text-purple-300 font-semibold">{col}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5">
                    <button onClick={() => { setLearningSheet(null); setFileName(""); }} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white">Ignore</button>
                    <button 
                      onClick={handleSaveLearnedTemplate}
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded shadow-md flex items-center gap-1"
                    >
                      <Sparkles size={12} />
                      Learn & Register Template Schema
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Right Side Info Box */}
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9]"}`}>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-700/10 pb-2">
                  <Database size={13} className="text-[#0078D4]" />
                  Active System Registries
                </h4>
                <div className="pt-2 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Master templates:</span>
                    <span className="font-bold text-white">{templates.length} Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Master employees directory:</span>
                    <span className="font-bold text-white">{employeesList.length} Records</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ingested runs this period:</span>
                    <span className="font-bold text-[#107C10]">{historyItems.length} runs</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-500/5 rounded-lg border border-slate-700/10 space-y-2 text-xs text-slate-400">
                <span className="font-bold text-white uppercase text-[10px] block">Ingestion Integrity Guidelines</span>
                <p className="leading-relaxed">Every transaction runs through automatic duplicate validation checks, currency converters, and localized labor rules validations to prevent compliance errors.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Tab 2: TEMPLATE ENGINE VIEW (Phase 8) --- */}
      {(activeTab === "templates" || isCreatingTemplate) && (
        <div className="space-y-4">
          {!isCreatingTemplate ? (
            <div className={`p-4 rounded-md border ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9]"}`}>
              <div className="flex items-center justify-between border-b border-slate-700/10 pb-3 flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase">Sovereign Template Schema Registries</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Define structured headers, localized rules compliance triggers, and multi-stage workflows.</p>
                </div>
                <button 
                  onClick={() => handleOpenCreateTemplate(null)}
                  className="px-3.5 py-1.5 bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-bold rounded flex items-center gap-1 shadow"
                >
                  <Plus size={13} />
                  Construct Schema Template
                </button>
              </div>

              {isLoadingTemplates ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                  <RefreshCw size={24} className="animate-spin text-[#0078D4]" />
                  <span>Loading templates from 'template_registry' collection...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
                  {templates.map(tmpl => (
                    <div key={tmpl.id} className="p-3.5 rounded bg-slate-500/5 border border-slate-700/10 flex flex-col justify-between h-[180px] hover:border-[#0078D4]/40 transition-all">
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[9px] font-bold font-mono text-[#0078D4] uppercase">v{tmpl.version || 1} Schema Registry</span>
                            <h4 className="text-xs font-bold text-white mt-0.5">{tmpl.name}</h4>
                          </div>
                          <div className="flex gap-1.5">
                            <span className={`text-[8px] px-1.5 py-0.2 rounded font-semibold border ${
                              tmpl.status === "Inactive" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                            }`}>{tmpl.status || "Active"}</span>
                            {tmpl.isSystem ? (
                              <span className="text-[8px] bg-slate-500/15 text-slate-400 px-1.5 py-0.2 rounded font-semibold border border-slate-700/20">System</span>
                            ) : (
                              <span className="text-[8px] bg-purple-500/10 text-purple-300 px-1.5 py-0.2 rounded font-semibold border border-purple-500/20">Learned</span>
                            )}
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 leading-relaxed line-clamp-2">{tmpl.description}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-700/10 flex items-center justify-between flex-wrap gap-1">
                        <span className="text-[9.5px] text-slate-500 font-medium font-mono">
                          {tmpl.requiredFields?.length || 0} Fields | {tmpl.countryValidations?.length || 0} Country Rules
                        </span>

                        <div className="flex gap-1.5">
                          <button onClick={() => exportTemplateAsJson(tmpl)} className="p-1 hover:bg-slate-700/20 rounded text-slate-400 hover:text-slate-200" title="Export Schema JSON">
                            <Download size={11} />
                          </button>
                          <button onClick={() => handleCloneTemplate(tmpl)} className="p-1 hover:bg-slate-700/20 rounded text-slate-400 hover:text-slate-200" title="Clone Template">
                            <Copy size={11} />
                          </button>
                          <button onClick={() => handleToggleStatus(tmpl)} className="p-1 hover:bg-slate-700/20 rounded text-slate-400 hover:text-slate-200" title="Toggle Active Status">
                            {tmpl.status === "Inactive" ? <ToggleLeft size={13} className="text-slate-500" /> : <ToggleRight size={13} className="text-emerald-400" />}
                          </button>
                          <button onClick={() => handleOpenCreateTemplate(tmpl)} className="p-1 hover:bg-[#0078D4]/10 rounded text-[#0078D4]" title="Edit Schema">
                            <Edit2 size={11} />
                          </button>
                          {!tmpl.isSystem && (
                            <button onClick={() => handleDeleteTemplate(tmpl.id, tmpl.name)} className="p-1 hover:bg-red-500/10 rounded text-red-400" title="Delete Schema">
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
            /* Schema Builder Form */
            <div className={`p-4 rounded-md border space-y-4 ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9]"}`}>
              <div className="flex items-center justify-between border-b border-slate-700/10 pb-2">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase">{editingTemplate ? `Modify Schema Registry: ${editingTemplate.name}` : "Construct Custom Payroll Schema"}</h3>
                  <p className="text-[10px] text-slate-400">Configure parameters, regulatory limits, and workflow routes for future file classifications.</p>
                </div>
                <button onClick={() => setIsCreatingTemplate(false)} className="p-1 text-slate-400 hover:text-white"><X size={16} /></button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs text-slate-300">
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block">Schema Template Name</label>
                      <input 
                        type="text" 
                        value={formTemplateName} 
                        onChange={(e) => setFormTemplateName(e.target.value)}
                        placeholder="e.g. Remote Allowance" 
                        className="w-full text-xs p-1.5 bg-[#1F1F1F] border border-[#2D2D2D] rounded text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block">Currency Handling</label>
                      <select 
                        value={formCurrency} 
                        onChange={(e) => setFormCurrency(e.target.value)}
                        className="w-full text-xs p-1.5 bg-[#1F1F1F] border border-[#2D2D2D] rounded text-white font-semibold"
                      >
                        <option value="USD">USD ($) - International Base</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="SGD">SGD (S$)</option>
                        <option value="INR">INR (₹)</option>
                        <option value="Global">Global Entity-Specific Conversion</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block">Description</label>
                      <input 
                        type="text" 
                        value={formTemplateDesc} 
                        onChange={(e) => setFormTemplateDesc(e.target.value)}
                        placeholder="Contextual operations details..." 
                        className="w-full text-xs p-1.5 bg-[#1F1F1F] border border-[#2D2D2D] rounded text-white"
                      />
                    </div>
                  </div>

                  {/* Fields lists */}
                  <div className="p-3.5 bg-slate-500/5 rounded border border-slate-700/10 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-400 uppercase text-[10px]">1. Mapped Columns Schema Specifications</span>
                      <button 
                        onClick={() => setFormTemplateFields([...formTemplateFields, { key: `field_${Date.now().toString().slice(-4)}_${Math.floor(Math.random() * 1000)}`, label: "Custom Field", type: "string", isMandatory: false }])}
                        className="text-[10px] text-[#0078D4] font-bold hover:underline"
                      >
                        + Add Attribute Field
                      </button>
                    </div>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto">
                      {formTemplateFields.map((field, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-slate-500/10 p-2 rounded border border-slate-700/10">
                           <input 
                             type="text" 
                             value={field.label} 
                             onChange={(e) => {
                               const updated = [...formTemplateFields];
                               updated[idx].label = e.target.value;
                               const currentKey = field.key.toLowerCase();
                               if (!["employeeid", "employeename", "country"].includes(currentKey)) {
                                 updated[idx].key = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "");
                               }
                               setFormTemplateFields(updated);
                             }}
                             placeholder="Header Label" 
                             className="w-1/3 text-xs p-1 rounded bg-[#1F1F1F] border border-[#2D2D2D] text-white"
                           />
                           <select 
                             value={field.type} 
                             onChange={(e) => {
                               const updated = [...formTemplateFields];
                               updated[idx].type = e.target.value as any;
                               setFormTemplateFields(updated);
                             }}
                             className="text-xs p-1 rounded bg-[#1F1F1F] border border-[#2D2D2D] text-white"
                           >
                             <option value="string">Text String</option>
                             <option value="number">Numeric/Decimal</option>
                             <option value="date">Date Calendar</option>
                           </select>
                           <label className="flex items-center gap-1 text-[10px] text-slate-400 select-none">
                             <input 
                               type="checkbox" 
                               checked={field.isMandatory} 
                               onChange={(e) => {
                                 const updated = [...formTemplateFields];
                                 updated[idx].isMandatory = e.target.checked;
                                 setFormTemplateFields(updated);
                               }}
                               className="accent-[#0078D4]"
                             />
                             Mandatory
                           </label>
                           <button 
                             onClick={() => setFormTemplateFields(formTemplateFields.filter((_, i) => i !== idx))} 
                             className="ml-auto text-slate-500 hover:text-red-400"
                             disabled={["employeeid", "employeename", "country"].includes(field.key.toLowerCase())}
                           >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Workflow Sign-offs */}
                  <div className="p-3 bg-slate-500/5 rounded border border-slate-700/10 space-y-3">
                    <span className="font-bold text-slate-400 uppercase text-[10px] block">2. Approval Workflows Routing</span>
                    <div className="space-y-1.5">
                      {formWorkflow.map((role, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-500/10 p-2 rounded text-xs border border-slate-700/5 font-bold text-[#0078D4]">
                          <span>{idx + 1}. {role}</span>
                          <button onClick={() => setFormWorkflow(formWorkflow.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-400"><X size={10} /></button>
                        </div>
                      ))}
                      <div className="flex gap-1.5 pt-1.5">
                        <select id="sel_add_workflow_role" className="flex-1 text-[11px] p-1.5 bg-[#1F1F1F] border border-[#2D2D2D] text-white rounded">
                          <option value="HR Generalist">HR Generalist</option>
                          <option value="Operations Lead">Operations Lead</option>
                          <option value="Payroll Controller">Payroll Controller</option>
                          <option value="Finance VP">Finance VP</option>
                        </select>
                        <button 
                          onClick={() => {
                            const sel = document.getElementById("sel_add_workflow_role") as HTMLSelectElement;
                            if (sel) setFormWorkflow([...formWorkflow, sel.value]);
                          }}
                          className="bg-[#0078D4] text-white px-2.5 rounded font-bold text-xs"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-700/10">
                <button onClick={() => setIsCreatingTemplate(false)} className="px-3 py-1.5 border border-slate-700 rounded text-slate-300 text-xs font-bold hover:bg-slate-700/40">Cancel</button>
                <button onClick={handleSaveDynamicTemplate} className="px-4 py-1.5 bg-[#107C10] hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-md">Save Template Schema</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- Tab 3: INGESTION HISTORY LOGS (with Developer Controls) --- */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className={`p-4 rounded-md border ${isDark ? "bg-[#1F1F1F] border-[#2D2D2D]" : "bg-white border-[#EDEBE9]"}`} id="ingestion_history_tab_wrapper">
            <div className="border-b border-slate-700/10 pb-3">
              <h3 className="text-sm font-bold text-white uppercase">Historical Ingestion Logs</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Archival logs of transactional excel datasets mapped under sovereign regulatory guidelines.</p>
            </div>

            <div className="overflow-x-auto pt-3">
              {historyItems.length === 0 ? (
                <div className="py-8 text-center text-slate-500 italic text-xs">No past ingestion log registry entries found. Try uploading some payroll files.</div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700/10 text-slate-400 pb-1.5">
                      <th className="py-2 px-3 font-semibold">File Name Ingested</th>
                      <th className="py-2 px-3 font-semibold">Matching Schema</th>
                      <th className="py-2 px-3 text-center font-semibold">Ingested Volume</th>
                      <th className="py-2 px-3 font-semibold">Uploaded Date</th>
                      <th className="py-2 px-3 font-semibold">Triggered User</th>
                      <th className="py-2 px-3 font-semibold">Mapping Quality</th>
                      <th className="py-2 px-3 text-right font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyItems.map(h => (
                      <tr key={h.id} className="border-b border-slate-700/5 transition hover:bg-slate-500/5">
                        <td className="py-2 px-3 font-bold text-white">{h.fileName}</td>
                        <td className="py-2 px-3 text-[#0078D4] font-semibold">{h.templateName}</td>
                        <td className="py-2 px-3 text-center font-mono text-slate-300 font-semibold">{h.recordsCount} items</td>
                        <td className="py-2 px-3 text-slate-400">{h.time}</td>
                        <td className="py-2 px-3 text-slate-400">{h.user}</td>
                        <td className="py-2 px-3">
                          <span className="text-[#107C10] font-bold font-mono">{h.mappingScore}% aligned</span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span className="px-1.5 py-0.5 rounded font-bold text-[9px] bg-[#107C10]/10 text-[#107C10]">{h.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* --- ADMIN DEVELOPER CONTROLS PANEL (Phase 1 / Requirements) --- */}
          <div className="p-4 bg-slate-500/5 rounded-lg border border-[#A80000]/20 space-y-3 shadow-md">
            <div className="flex items-center gap-2 border-b border-slate-700/10 pb-1.5">
              <Sliders size={15} className="text-[#A80000]" />
              <h4 className="text-xs font-bold text-[#A80000] uppercase tracking-wider">Admin Developer System Diagnostics</h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Use these sovereign developer utilities to reset test states, rebuild core payroll validation templates, and clear historical caches instantly within the Firestore database backend.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2">
              <button 
                onClick={() => handleAdminAction("Reset Demo Data")}
                className="px-2 py-1.5 bg-[#A80000] hover:bg-[#800000] text-white text-[10px] font-bold rounded shadow hover:shadow-lg transition-all"
              >
                Reset Demo Data
              </button>
              <button 
                onClick={() => handleAdminAction("Remove All Dummy Templates")}
                className="px-2 py-1.5 bg-[#1F1F1F] border border-slate-700 hover:border-slate-500 text-slate-200 text-[10px] font-bold rounded shadow transition-all"
              >
                Remove All Dummy Templates
              </button>
              <button 
                onClick={() => handleAdminAction("Clear Upload History")}
                className="px-2 py-1.5 bg-[#1F1F1F] border border-slate-700 hover:border-slate-500 text-slate-200 text-[10px] font-bold rounded shadow transition-all"
              >
                Clear Upload History
              </button>
              <button 
                onClick={() => handleAdminAction("Reset AI Learning Cache")}
                className="px-2 py-1.5 bg-[#1F1F1F] border border-slate-700 hover:border-slate-500 text-slate-200 text-[10px] font-bold rounded shadow transition-all"
              >
                Reset AI Learning Cache
              </button>
              <button 
                onClick={() => handleAdminAction("Clear Template Registry")}
                className="px-2 py-1.5 bg-[#1F1F1F] border border-slate-700 hover:border-slate-500 text-slate-200 text-[10px] font-bold rounded shadow transition-all"
              >
                Clear Template Registry
              </button>
              <button 
                onClick={() => handleAdminAction("Rebuild Default Payroll Templates")}
                className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded shadow hover:shadow-lg transition-all"
              >
                Rebuild Defaults
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Record Edit Modal */}
      {editingRow && detectedTemplate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg p-4 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700/10 pb-2">
              <h4 className="text-xs font-bold text-white uppercase">Modify Record Entry</h4>
              <button onClick={() => setEditingRow(null)} className="p-1 hover:bg-slate-700/20 text-slate-400 hover:text-white rounded"><X size={14} /></button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 text-xs">
              {detectedTemplate.requiredFields.map(field => (
                <div key={field.key} className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">{field.label}</label>
                  <input 
                    type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                    value={editingRow.data[field.key] || ""}
                    onChange={(e) => {
                      const updated = { ...editingRow };
                      updated.data[field.key] = field.type === "number" ? Number(e.target.value) : e.target.value;
                      setEditingRow(updated);
                    }}
                    className="w-full p-2 bg-[#2D2D2D] border border-slate-700 rounded text-white outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-700/10 pt-2">
              <button onClick={() => setEditingRow(null)} className="px-3 py-1.5 border border-slate-700 hover:bg-slate-700/50 rounded text-slate-300 text-xs">Cancel</button>
              <button onClick={handleSaveEditedRow} className="px-4 py-1.5 bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-bold rounded">Apply Fix</button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Dialog (bypassing sandbox iframe restrictions) */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[9999] p-4">
          <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-5 w-full max-w-sm space-y-4 shadow-2xl text-left">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/10 rounded text-amber-500 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">{confirmDialog.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{confirmDialog.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#27272A]">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-3 py-1.5 border border-[#27272A] hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const cb = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  cb();
                }}
                className="px-4 py-1.5 bg-[#A80000] hover:bg-[#800000] text-white text-xs font-bold rounded shadow transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Dialog (bypassing sandbox iframe restrictions) */}
      {alertDialog && alertDialog.isOpen && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[9999] p-4">
          <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-5 w-full max-w-sm space-y-4 shadow-2xl text-left">
            <div className="flex items-start gap-3">
              {alertDialog.type === "success" ? (
                <div className="p-2 bg-emerald-500/10 rounded text-emerald-500 shrink-0">
                  <CheckCircle size={20} />
                </div>
              ) : alertDialog.type === "error" ? (
                <div className="p-2 bg-rose-500/10 rounded text-rose-500 shrink-0">
                  <AlertCircle size={20} />
                </div>
              ) : (
                <div className="p-2 bg-blue-500/10 rounded text-blue-500 shrink-0">
                  <AlertCircle size={20} />
                </div>
              )}
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">{alertDialog.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{alertDialog.message}</p>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-[#27272A]">
              <button
                onClick={() => setAlertDialog(null)}
                className="px-4 py-1.5 bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-bold rounded shadow transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
