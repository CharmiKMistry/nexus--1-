import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to save persistent MongoDB configuration and Local JSON database
const CONFIG_FILE = path.join(process.cwd(), "mongodb_config.json");
const LOCAL_DB_FILE = path.join(process.cwd(), "local_database.json");

interface MongoConfig {
  uri: string;
  dbName: string;
}

let mongoClient: MongoClient | null = null;
let mongoDb: any = null;
let dbConfig: MongoConfig = {
  uri: process.env.MONGODB_URI || "",
  dbName: "nexus"
};

// Try to load saved config
if (fs.existsSync(CONFIG_FILE)) {
  try {
    const data = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    if (data.uri) {
      dbConfig = data;
    }
  } catch (err) {
    console.error("Failed to read mongodb_config.json:", err);
  }
}

// In-Memory/JSON fallback database structure
let localDatabase: {
  countries: any[];
  employees: any[];
  validationResults: any[];
  reconciliationResults: any[];
  auditLogs: any[];
  users: any[];
  permissions: any[];
  loginLogs: any[];
} = {
  countries: [],
  employees: [],
  validationResults: [],
  reconciliationResults: [],
  auditLogs: [],
  users: [],
  permissions: [],
  loginLogs: []
};

// Load or seed local JSON database
function loadLocalDatabase() {
  if (fs.existsSync(LOCAL_DB_FILE)) {
    try {
      localDatabase = JSON.parse(fs.readFileSync(LOCAL_DB_FILE, "utf-8"));
      // Ensure backward-compatibility for pre-existing json databases
      if (!localDatabase.users) localDatabase.users = [];
      if (!localDatabase.permissions) localDatabase.permissions = [];
      if (!localDatabase.loginLogs) localDatabase.loginLogs = [];
      
      if (localDatabase.users.length > 0 && localDatabase.permissions.length > 0) {
        console.log("Loaded dynamic local JSON database with enterprise user modules.");
        return;
      }
    } catch (err) {
      console.error("Failed to parse local_database.json, re-seeding:", err);
    }
  }
  
  // Seed initial data if file doesn't exist or is missing user/permission module
  const sgReadiness = 100;
  const deReadiness = 92;
  const usReadiness = 74;
  const jpReadiness = 89;
  const frReadiness = 65;

  localDatabase.countries = [
    {
      id: "sg",
      name: "Singapore",
      flag: "🇸🇬",
      currency: "SGD (S$)",
      workingHours: 44,
      taxRules: "Progressive statutory tax rate from 0% up to 22%. CPF contribution required (up to 20% employee, up to 17% employer).",
      overtimePolicy: "1.5x hourly rate for hours worked over 44 per week. Excludes executive/managerial roles.",
      leavePolicy: "Minimum 14 days statutory paid annual leave + 14 days paid sick leave.",
      holidayCalendar: "11 Gazetted Public Holidays (Chinese New Year, Hari Raya, National Day, Christmas, etc.)",
      payrollCalendar: "Monthly payroll run on the 25th of each month.",
      workflow: ["HR Draft", "Finance Review", "Country Admin Certification", "Executive Release"],
      readinessScore: sgReadiness,
      complianceScore: 100,
      dataQualityScore: 98,
      status: "Completed",
      riskLevel: "Low"
    },
    {
      id: "de",
      name: "Germany",
      flag: "🇩🇪",
      currency: "EUR (€)",
      workingHours: 40,
      taxRules: "Statutory income tax (Lohnsteuer) from 14% to 45%. Solidaritätszuschlag (5.5%). Health, pension, and unemployment social security (~20% employee, ~20% employer).",
      overtimePolicy: "Max daily hours 8h. Extendable to 10h if average is 8h over 6 months. 11h consecutive rest required.",
      leavePolicy: "Minimum 20 days paid annual leave based on 5-day week.",
      holidayCalendar: "9-13 Public Holidays depending on federal state.",
      payrollCalendar: "Monthly payroll run on the 28th of each month.",
      workflow: ["HR Draft", "Compliance Verification", "Country Admin Certification", "Executive Release"],
      readinessScore: deReadiness,
      complianceScore: 94,
      dataQualityScore: 91,
      status: "Pending Approval",
      riskLevel: "Medium"
    },
    {
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
      readinessScore: usReadiness,
      complianceScore: 82,
      dataQualityScore: 86,
      status: "Validating",
      riskLevel: "High"
    },
    {
      id: "jp",
      name: "Japan",
      flag: "🇯🇵",
      currency: "JPY (¥)",
      workingHours: 40,
      taxRules: "National income tax (5% to 45%), Local inhabitant tax (10%), Social Insurance (Health, Pension, Long-term care, Employment).",
      overtimePolicy: "Statutory premium is 1.25x for regular overtime, 1.35x for holiday work, 1.5x for late-night overtime (10pm-5am).",
      leavePolicy: "10 days paid leave after 6 months of service, scaling to 20 days.",
      holidayCalendar: "16 National Holidays (Golden Week, Mountain Day, Respect for the Aged Day, etc.)",
      payrollCalendar: "Monthly payroll run on the 25th of each month.",
      workflow: ["HR Draft", "Compliance Verification", "Executive Release"],
      readinessScore: jpReadiness,
      complianceScore: 95,
      dataQualityScore: 90,
      status: "Pending Verification",
      riskLevel: "Low"
    },
    {
      id: "fr",
      name: "France",
      flag: "🇫🇷",
      currency: "EUR (€)",
      workingHours: 35,
      taxRules: "Progressive personal tax, substantial employer social contributions (~45% of base wage), and employee contributions (~22%).",
      overtimePolicy: "Hours 36-43 paid at 1.25x premium. Hours 44+ paid at 1.5x premium. RTT days offered for working hours over 35h.",
      leavePolicy: "5 weeks (25 working days) paid annual leave + supplementary RTT days.",
      holidayCalendar: "11 Public Holidays (Bastille Day, Armistice Day, Labour Day, etc.)",
      payrollCalendar: "Monthly payroll run on the 30th of each month.",
      workflow: ["HR Draft", "Finance Review", "Country Admin Certification", "Executive Release"],
      readinessScore: frReadiness,
      complianceScore: 78,
      dataQualityScore: 81,
      status: "Draft",
      riskLevel: "Medium"
    },
    {
      id: "in",
      name: "India",
      flag: "🇮🇳",
      currency: "INR (₹)",
      workingHours: 48,
      taxRules: "Income tax slabs from 5% to 30% under New/Old Tax Regime. EPF contributions required (12% employee, 12% employer on basic pay). Professional Tax varies by state.",
      overtimePolicy: "Double the ordinary hourly wage rate for any work performed beyond 9 hours in a day or 48 hours in a week under Factories Act.",
      leavePolicy: "Minimum 15 days of earned leave (EL), 12 days of sick leave (SL) and casual leave (CL) as per Shops & Establishments Act.",
      holidayCalendar: "3 Mandatory National Holidays (Republic Day, Independence Day, Gandhi Jayanti) + 10-15 Gazetted and Restricted Public Holidays based on state.",
      payrollCalendar: "Monthly payroll run on the last working day of each month.",
      workflow: ["HR Draft", "Finance Review", "Country Admin Certification", "Executive Release"],
      readinessScore: 100,
      complianceScore: 100,
      dataQualityScore: 100,
      status: "Completed",
      riskLevel: "Low"
    }
  ];

  localDatabase.employees = [
    { id: "EMP-1042", name: "Anna Weber", country: "Germany", department: "Engineering", title: "Principal Architect", salary: 8500, status: "Active" },
    { id: "EMP-2109", name: "Marcus Tan", country: "Singapore", department: "Product", title: "Product Lead", salary: 7800, status: "Active" },
    { id: "EMP-0098", name: "Sarah Jenkins", country: "United States", department: "Sales", title: "VP Global Sales", salary: 12500, status: "Active" },
    { id: "EMP-3045", name: "Hiroshi Sato", country: "Japan", department: "Operations", title: "Director of Ops", salary: 11000, status: "Active" },
    { id: "EMP-1204", name: "Pierre Dubois", country: "France", department: "Marketing", title: "Senior Manager", salary: 6200, status: "Active" },
    { id: "EMP-8044", name: "Amit Patel", country: "India", department: "Engineering", title: "Lead Software Engineer", salary: 120000, status: "Active" }
  ];

  localDatabase.validationResults = [
    {
      id: "val-1",
      employeeId: "EMP-1042",
      employeeName: "Anna Weber",
      country: "Germany",
      issueType: "Overtime Violations",
      severity: "High",
      confidenceScore: 98,
      explanation: "Worked 11.5 hours in a single shift, exceeding the 10-hour daily threshold mandated by the Germany Working Time Act (Arbeitszeitgesetz).",
      recommendedResolution: "Convert excess 1.5 hours into TOIL (Time-Off-In-Lieu) balance and issue a formal compliance bypass log.",
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
    }
  ];

  localDatabase.reconciliationResults = [
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
    }
  ];

  localDatabase.auditLogs = [
    {
      id: "audit-1",
      timestamp: new Date().toISOString(),
      user: "System",
      role: "Super Admin",
      action: "Database Initialized",
      details: "Seeded initial dynamic compliance rosters, countries, and audit results."
    }
  ];

  localDatabase.users = [
    {
      id: "user-1",
      name: "Ronak Surve",
      psNumber: "PS-09600",
      email: "ronaksurve96@gmail.com",
      department: "Executive Office",
      country: "India",
      roles: ["Super Admin", "Executive Leadership"],
      status: "Active",
      password: "Password123!",
      lastLogin: "2026-07-06T10:25:00Z",
      failedLoginAttempts: 0,
      mfaEnabled: true,
      passwordExpiryDate: "2026-10-01",
      mfaStatus: "Enabled"
    },
    {
      id: "user-2",
      name: "John Smith",
      psNumber: "PS-00122",
      email: "john.smith@nexus-corp.com",
      department: "HR",
      country: "Singapore",
      roles: ["HR", "Payroll Administrator", "Country Payroll Administrator"],
      status: "Active",
      password: "Password123!",
      lastLogin: "2026-07-05T09:12:00Z",
      failedLoginAttempts: 0,
      mfaEnabled: true,
      passwordExpiryDate: "2026-09-15",
      mfaStatus: "Enabled"
    },
    {
      id: "user-3",
      name: "Emma Watson",
      psNumber: "PS-02241",
      email: "emma.watson@nexus-corp.com",
      department: "Finance",
      country: "Germany",
      roles: ["Finance", "Compliance Officer"],
      status: "Active",
      password: "Password123!",
      lastLogin: "2026-07-04T14:22:00Z",
      failedLoginAttempts: 0,
      mfaEnabled: false,
      passwordExpiryDate: "2026-08-01",
      mfaStatus: "Disabled"
    },
    {
      id: "user-4",
      name: "Kenji Sato",
      psNumber: "PS-03310",
      email: "kenji.sato@nexus-corp.com",
      department: "Operations",
      country: "Japan",
      roles: ["Country Payroll Administrator", "Auditor"],
      status: "Locked",
      password: "Password123!",
      lastLogin: "2026-07-01T11:05:00Z",
      failedLoginAttempts: 5,
      mfaEnabled: true,
      passwordExpiryDate: "2026-07-30",
      mfaStatus: "Enabled"
    },
    {
      id: "user-charmi",
      name: "Charmi Patel",
      psNumber: "PS-08045",
      email: "charmipatel@gmail.com",
      department: "HR",
      country: "India",
      roles: ["HR"],
      status: "Active",
      password: "123456",
      lastLogin: "2026-07-09T10:00:00Z",
      failedLoginAttempts: 0,
      mfaEnabled: false,
      passwordExpiryDate: "2027-12-31",
      mfaStatus: "Disabled"
    }
  ];

  localDatabase.permissions = [
    { id: "perm-1", role: "Super Admin", permissions: { "Payroll Upload": true, "Validation": true, "Approvals": true, "Reports": true, "Audit": true, "Country Rules": true, "Administration": true, "User Management": true } },
    { id: "perm-2", role: "Payroll Administrator", permissions: { "Payroll Upload": true, "Validation": true, "Approvals": false, "Reports": true, "Audit": true, "Country Rules": false, "Administration": false, "User Management": false } },
    { id: "perm-3", role: "Country Payroll Administrator", permissions: { "Payroll Upload": true, "Validation": true, "Approvals": true, "Reports": true, "Audit": true, "Country Rules": true, "Administration": false, "User Management": false } },
    { id: "perm-4", role: "HR", permissions: { "Payroll Upload": true, "Validation": true, "Approvals": false, "Reports": true, "Audit": false, "Country Rules": false, "Administration": false, "User Management": false } },
    { id: "perm-5", role: "Finance", permissions: { "Payroll Upload": false, "Validation": false, "Approvals": true, "Reports": true, "Audit": true, "Country Rules": false, "Administration": false, "User Management": false } },
    { id: "perm-6", role: "Compliance Officer", permissions: { "Payroll Upload": false, "Validation": true, "Approvals": false, "Reports": true, "Audit": true, "Country Rules": true, "Administration": false, "User Management": false } },
    { id: "perm-7", role: "Auditor", permissions: { "Payroll Upload": false, "Validation": false, "Approvals": false, "Reports": true, "Audit": true, "Country Rules": false, "Administration": false, "User Management": false } },
    { id: "perm-8", role: "Executive Leadership", permissions: { "Payroll Upload": false, "Validation": false, "Approvals": false, "Reports": true, "Audit": true, "Country Rules": false, "Administration": false, "User Management": false } }
  ];

  localDatabase.loginLogs = [
    { id: "log-1", timestamp: "2026-07-06T10:25:00Z", email: "ronaksurve96@gmail.com", name: "Ronak Surve", browser: "Chrome", device: "Windows Desktop", ip: "192.168.1.55", method: "Microsoft SSO", status: "Success" },
    { id: "log-2", timestamp: "2026-07-06T10:15:00Z", email: "kenji.sato@nexus-corp.com", name: "Kenji Sato", browser: "Safari", device: "macOS Laptop", ip: "203.112.45.18", method: "Password", status: "Failed", details: "Incorrect password attempt 5 - account locked." },
    { id: "log-3", timestamp: "2026-07-05T09:12:00Z", email: "john.smith@nexus-corp.com", name: "John Smith", browser: "Edge", device: "Windows Desktop", ip: "10.0.4.120", method: "Microsoft SSO", status: "Success" }
  ];

  saveLocalDatabase();
}

function saveLocalDatabase() {
  try {
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(localDatabase, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write local_database.json:", err);
  }
}

// Connect to MongoDB
async function connectToMongo(uri: string, dbName: string = "nexus") {
  if (mongoClient) {
    try {
      await mongoClient.close();
    } catch (e) {}
  }

  mongoClient = new MongoClient(uri, {
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000
  });

  await mongoClient.connect();
  mongoDb = mongoClient.db(dbName);
  console.log(`Successfully connected to MongoDB database: ${dbName}`);

  // Auto-seed MongoDB if collections are empty
  await seedMongoIfEmpty();
  await ensureSuperAdminInMongo();

  // Save successful config
  dbConfig = { uri, dbName };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(dbConfig, null, 2), "utf-8");
}

async function seedMongoIfEmpty() {
  if (!mongoDb) return;
  
  const collections = ["countries", "employees", "validationResults", "reconciliationResults", "auditLogs"];
  for (const col of collections) {
    const count = await mongoDb.collection(col).countDocuments();
    if (count === 0) {
      console.log(`Seeding empty MongoDB collection: ${col}`);
      // Migrate from localDatabase
      const data = (localDatabase as any)[col];
      if (data && data.length > 0) {
        await mongoDb.collection(col).insertMany(data);
      }
    }
  }
}

// Ensure Super Admin user is registered from backend
function ensureSuperAdminUser() {
  const superAdminEmail = "ronaksurve@gmail.com";
  const superAdminUser = localDatabase.users.find(
    (u: any) => u.email.toLowerCase() === superAdminEmail.toLowerCase()
  );

  if (superAdminUser) {
    superAdminUser.password = "Fy2crhwww@";
    superAdminUser.roles = ["Super Admin", "Executive Leadership"];
    superAdminUser.status = "Active";
    superAdminUser.mfaEnabled = true;
    console.log(`Backend confirmed Super Admin updated: ${superAdminEmail}`);
  } else {
    localDatabase.users.push({
      id: "user-super-admin",
      name: "Ronak Surve",
      psNumber: "PS-09999",
      email: superAdminEmail,
      department: "Executive Office",
      country: "India",
      roles: ["Super Admin", "Executive Leadership"],
      status: "Active",
      password: "Fy2crhwww@",
      lastLogin: new Date().toISOString(),
      failedLoginAttempts: 0,
      mfaEnabled: true,
      passwordExpiryDate: "2027-12-31",
      mfaStatus: "Enabled"
    });
    console.log(`Backend registered Super Admin: ${superAdminEmail}`);
  }
  saveLocalDatabase();
}

async function ensureSuperAdminInMongo() {
  if (!mongoDb) return;
  try {
    const superAdminEmail = "ronaksurve@gmail.com";
    const user = await mongoDb.collection("users").findOne({ email: { $regex: new RegExp(`^${superAdminEmail}$`, "i") } });
    if (user) {
      await mongoDb.collection("users").updateOne(
        { _id: user._id },
        { $set: { password: "Fy2crhwww@", roles: ["Super Admin", "Executive Leadership"], status: "Active" } }
      );
      console.log(`MongoDB confirmed Super Admin updated: ${superAdminEmail}`);
    } else {
      await mongoDb.collection("users").insertOne({
        id: "user-super-admin",
        name: "Ronak Surve",
        psNumber: "PS-09999",
        email: superAdminEmail,
        department: "Executive Office",
        country: "India",
        roles: ["Super Admin", "Executive Leadership"],
        status: "Active",
        password: "Fy2crhwww@",
        lastLogin: new Date().toISOString(),
        failedLoginAttempts: 0,
        mfaEnabled: true,
        passwordExpiryDate: "2027-12-31",
        mfaStatus: "Enabled"
      });
      console.log(`MongoDB registered Super Admin: ${superAdminEmail}`);
    }
  } catch (err) {
    console.error("Failed to ensure super admin in MongoDB:", err);
  }
}

// Initial Connection Attempt (runs on server boot)
loadLocalDatabase();
ensureSuperAdminUser();
if (dbConfig.uri) {
  connectToMongo(dbConfig.uri, dbConfig.dbName)
    .then(() => {
      console.log("Automatically connected to saved MongoDB on startup.");
    })
    .catch(err => {
      console.warn("Could not auto-connect to saved MongoDB on startup. Falling back to dynamic JSON database:", err.message);
    });
}

// Initialize Gemini API client
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: any = null;

if (geminiApiKey && geminiApiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({ apiKey: geminiApiKey });
    console.log("Gemini AI client successfully initialized server-side.");
  } catch (error) {
    console.error("Failed to initialize Gemini AI client:", error);
  }
} else {
  console.log("No GEMINI_API_KEY found or using default. Running in smart simulation mode.");
}

// -------------------------------------------------------------------
// API ENDPOINT: AI COPILOT CHAT
// -------------------------------------------------------------------
app.post("/api/chat", async (req, res) => {
  const { messages, context } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages array" });
  }

  const userQuery = messages[messages.length - 1]?.content || "";

  // Mock Company RAG Database of Compliance Rules & Documents
  const mockDocuments = [
    { title: "Global Overtime Standard", content: "Overtime is calculated at 1.5x hourly rate for hours exceeding 40 in a week. Country-specific limits supersede this (e.g., France limit is 35 hours)." },
    { title: "Singapore Tax Compliance (CPF)", content: "CPF contribution is required for Singapore citizens and PRs. Employee rate is up to 20%, employer is up to 17% depending on age." },
    { title: "Germany Working Time Act", content: "ドイツ労働時間法 (Germany Working Time Act): Maximum daily hours is 8. Can be extended to 10 if average is 8 over 6 months. Mandatory 11 hours rest period." },
    { title: "US FLSA Overtime Exemptions", content: "To be exempt from overtime in the US, employees must earn at least $844 per week ($43,888 annually) and perform exempt duties (executive, administrative, or professional)." }
  ];

  // If we have AI initialized, let's use it!
  if (ai) {
    try {
      const history = messages.slice(0, -1).map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }));

      const ragContextText = mockDocuments.map(doc => `[Document: ${doc.title}]\n${doc.content}`).join("\n\n");
      
      const systemInstruction = `You are the NEXUS AI Copilot, an enterprise-grade Global Payroll Governance and Intelligence Assistant. 
You help payroll managers, HR admins, and compliance officers audit, reconcile, and validate global payroll.
Context about the active payroll cycle:
- Global Readiness Score: 87% (Target: 100%)
- Data Quality: High (89%)
- Active country-cycles: Singapore (Completed), Germany (Pending Approval), United States (Validating), France (Draft)
- Current issues: 3 duplicate employee records, 2 severe overtime violations in Germany, and CPF mismatch in Singapore.

Use the following RAG Knowledge Base to answer user questions if applicable:
${ragContextText}

Respond professionally, clearly, and in a structured format using markdown (bullet points, bold highlights, code blocks for tables if necessary). Keep answers highly precise, enterprise-ready, and helpful.`;

      // Formulate request
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: systemInstruction }] },
          ...history.map((h: any) => ({ role: h.role, parts: h.parts })),
          { role: "user", parts: [{ text: userQuery }] }
        ]
      });

      const replyText = response.text || "No response received from AI.";
      return res.json({ role: "assistant", content: replyText });
    } catch (error: any) {
      console.error("Gemini API Error in /api/chat:", error);
      // Fallback to simulated response
    }
  }

  // --- SMART SIMULATED RESPONSES WHEN GEMINI IS NOT AVAILABLE ---
  let answer = "";
  const queryLower = userQuery.toLowerCase();

  if (queryLower.includes("germany") || queryLower.includes("working time")) {
    answer = `### 🇩🇪 Germany Compliance Insights (Arbeitszeitgesetz)

Based on our active **NEXUS Rule Engine** and corporate policy guidelines:
1. **Working Hours Limit**: Employees in Germany are strictly limited to **8 hours/day** (extendable to 10 hours if average is 8 hours/day over a 6-month reference period).
2. **Current Flags Detected**: We have flagged **2 anomalies** in the Munich operations:
   - **Emp ID 1042 (Anna Weber)** worked 11.5 hours on Friday, July 3rd without matching overtime authorization.
   - **Mandatory Rest Period**: Flagged **1 rest period breach** (less than 11 consecutive hours of rest between shifts).
3. **Recommended Action**: Approve the system's adjustment to defer the excess 1.5 hours to the "Time-Off-In-Lieu" (TOIL) balance, or flag for local Country Admin manual review.`;
  } else if (queryLower.includes("singapore") || queryLower.includes("cpf") || queryLower.includes("tax")) {
    answer = `### 🇸🇬 Singapore CPF & Tax Reconciliation

Our real-time audit shows high data quality with a few discrepancies:
1. **CPF Discrepancy**: **Emp ID 2109 (Marcus Tan)** CPF contribution was calculated at 15% instead of the mandatory 20%. This is because his age bracket shifted to 'under 55' last month, but the HRMS profile was only updated yesterday.
2. **Action Item**: The system has automatically calculated a payroll retroactive correction of **S$ 250.00**. 
3. **Recommendation**: Approve the retroactive adjustment on the *Intelligent Reconciliation* tab to automatically push this to the final Singapore payroll-ready feed.`;
  } else if (queryLower.includes("report") || queryLower.includes("summary") || queryLower.includes("readiness")) {
    answer = `### 📊 NEXUS Executive Payroll Readiness Summary

Here is the global payroll cycle health summary:
- **Global Readiness Score**: **87%** (Critical threshold is 95%).
- **Completed Countries**: Singapore (100% ready), United Kingdom (100% ready).
- **Pending Country Approval**: Germany (92% - waiting for Compliance Officer signature).
- **Active Validation Phase**: United States (74% - 12 critical anomalies pending resolution).
- **Core Issues**:
  - 3 Duplicate Employee IDs detected between Workday and Fieldglass.
  - Salary inconsistencies in US sales division (variance exceeds configured ±15% threshold).
- **Predictive Risk**: High risk of compliance penalties in Germany if overtime breaches are not approved or corrected by **July 10th**.`;
  } else if (queryLower.includes("audit") || queryLower.includes("log")) {
    answer = `### 🔒 Audit & Governance Log Summary

The NEXUS Governance platform has logged all activities for this cycle:
- **System Actions**: 1,420 inputs ingested, 128 auto-mapped, 12 validation runs.
- **User Actions**: 4 manual rule updates (Germany Overtime Overrides by Admin), 12 resolved exceptions.
- **Agent Logs**: The *Validation Agent* and *Reconciliation Agent* completed full passes at 03:15 UTC.
- **Compliance Certification**: Ready for export. Download the detailed, immutable audit log via the **Compliance Module** tab in CSV or PDF.`;
  } else {
    answer = `### 👋 Welcome to NEXUS AI Copilot

I am your intelligent orchestration assistant. I can help you validate data, investigate compliance rules, resolve salary variances, and draft audit reports.

**Here are some things you can ask me:**
* "What compliance alerts are active for Germany?"
* "Explain Singapore CPF discrepancy and the retro adjustment"
* "Generate an executive summary of this month's payroll readiness"
* "Show me the working hours rule policy for France"`;
  }

  // Simulate delay
  setTimeout(() => {
    res.json({ role: "assistant", content: answer });
  }, 800);
});

// -------------------------------------------------------------------
// API ENDPOINT: AI DATA VALIDATION ENGINE
// -------------------------------------------------------------------
app.post("/api/validate", async (req, res) => {
  const { inputs } = req.body;
  
  if (ai && inputs && Array.isArray(inputs)) {
    try {
      const prompt = `Perform enterprise-grade payroll data validation for the following records.
For each record, evaluate:
1. Missing essential payroll parameters.
2. Salary rate variances or potential salary inconsistencies.
3. Excessive overtime or work hour rules violations.
4. Compliance risks.

Input records: ${JSON.stringify(inputs)}

Return a strict JSON array of objects. Each object MUST match this schema exactly:
{
  "id": "unique-id-from-input-or-index",
  "employeeId": "string",
  "employeeName": "string",
  "country": "string",
  "issueType": "string",
  "severity": "High" | "Medium" | "Low",
  "confidenceScore": number (0-100),
  "explanation": "string explaining what is wrong",
  "recommendedResolution": "string explaining how to fix it",
  "status": "Pending" | "Resolved" | "Ignored"
}
Output only the raw JSON. No markdown codeblocks, just the plain array.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });

      const responseText = response.text || "[]";
      // Sanitize potential markdown wrap
      const jsonText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(jsonText);
      return res.json({ success: true, results: parsed });
    } catch (e: any) {
      console.error("Gemini validation error:", e);
    }
  }

  // Dynamic simulation engine if no Gemini or error occurs
  const sampleResults = [
    {
      id: "val-1",
      employeeId: "EMP-1042",
      employeeName: "Anna Weber",
      country: "Germany",
      issueType: "Overtime Violations",
      severity: "High",
      confidenceScore: 98,
      explanation: "Worked 11.5 hours in a single shift, exceeding the 10-hour daily threshold mandated by the Germany Working Time Act (Arbeitszeitgesetz).",
      recommendedResolution: "Convert excess 1.5 hours into TOIL (Time-Off-In-Lieu) balance and issue a formal compliance bypass log.",
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
      employeeId: "EMP-3045",
      employeeName: "Hiroshi Sato",
      country: "Japan",
      issueType: "Missing National ID",
      severity: "High",
      confidenceScore: 100,
      explanation: "MyNumber (Japanese National Tax ID) is empty in the ingested payroll file. Required for statutory tax filings.",
      recommendedResolution: "Trigger automated outreach to employee via Microsoft Teams to securely request and ingest MyNumber.",
      status: "Pending"
    },
    {
      id: "val-5",
      employeeId: "EMP-1021",
      employeeName: "Elena Rostova",
      country: "Germany",
      issueType: "Duplicate Employee Entry",
      severity: "High",
      confidenceScore: 97,
      explanation: "Duplicate records for employee found across SAP Ingestion and Workday HRMS with identical tax ID but different bank routes.",
      recommendedResolution: "Merge records under the verified Workday bank routing code and flag the SAP entry as deprecated.",
      status: "Pending"
    }
  ];

  return res.json({ success: true, results: sampleResults });
});

// -------------------------------------------------------------------
// API ENDPOINT: INTELLIGENT RECONCILIATION
// -------------------------------------------------------------------
app.post("/api/reconcile", async (req, res) => {
  // Simulates or processes a side-by-side reconciliation comparison
  const comparisons = [
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
      employeeId: "EMP-0889",
      name: "Jean-Pierre",
      source: "Leaves (5 days)",
      target: "HRMS Balance (4 days)",
      discrepancy: "Negative Balance (-1 day)",
      type: "Leave Allocation Exception",
      confidence: 91,
      aiRecommendation: "Deduct 1 day of unpaid leave or convert to advance leave as approved by France Country Admin.",
      status: "Pending"
    },
    {
      id: "rec-4",
      employeeId: "EMP-4100",
      name: "David Smith",
      source: "Workday ($8,200.00)",
      target: "SAP Payroll ($8,500.00)",
      discrepancy: "-$300.00 Variance",
      type: "Base Pay Conflict",
      confidence: 96,
      aiRecommendation: "Align to Workday ($8,200.00) as it is the system of record. Reconcile SAP records on next sync cycle.",
      status: "Pending"
    }
  ];
  return res.json({ success: true, comparisons });
});

// -------------------------------------------------------------------
// API ENDPOINT: CHRONOLOGICAL AGENT EXECUTION LOGS
// -------------------------------------------------------------------
app.get("/api/agent-logs", (req, res) => {
  const logs = [
    { timestamp: "03:15:02", agent: "Data Collection Agent", status: "success", message: "Successfully polled Workday HRMS API; ingested 1,420 employee records." },
    { timestamp: "03:15:10", agent: "Data Collection Agent", status: "success", message: "Completed FTP ingestion of German Munich office Excel timesheets (82 entries)." },
    { timestamp: "03:15:15", agent: "Validation Agent", status: "running", message: "Running pattern recognition and anomaly scan over combined global records..." },
    { timestamp: "03:15:18", agent: "Validation Agent", status: "warning", message: "Flagged 5 compliance rules violations: 3 Overtime limits exceeded, 2 duplicates." },
    { timestamp: "03:15:22", agent: "Reconciliation Agent", status: "success", message: "Automated side-by-side verification of claims and hours complete. Inconsistencies generated." },
    { timestamp: "03:15:25", agent: "Compliance Agent", status: "running", message: "Validating German statutory tax brackets against current 2026 ruleset." },
    { timestamp: "03:15:30", agent: "Compliance Agent", status: "success", message: "German rule check passed. Compliance Health Score certified at 94%." },
    { timestamp: "03:15:35", agent: "Notification Agent", status: "success", message: "Dispatched Slack and Microsoft Teams approval alerts to Germany HR Leads." },
    { timestamp: "03:15:40", agent: "Audit Agent", status: "success", message: "Generated cryptographically signed block transaction in local audit log file." },
    { timestamp: "03:15:45", agent: "Reporting Agent", status: "idle", message: "Awaiting final admin approval to compile and release the Payroll-Ready output feeds." }
  ];
  return res.json({ success: true, logs });
});

// -------------------------------------------------------------------
// DYNAMIC MONGODB CONNECTOR & FALLBACK REST API ENDPOINTS
// -------------------------------------------------------------------

app.get("/api/mongodb/status", async (req, res) => {
  try {
    const connected = mongoClient !== null && mongoDb !== null;
    let collections: string[] = [];
    let counts: Record<string, number> = {};
    
    if (connected && mongoDb) {
      const list = await mongoDb.listCollections().toArray();
      collections = list.map((c: any) => c.name);
      for (const name of collections) {
        counts[name] = await mongoDb.collection(name).countDocuments();
      }
    } else {
      collections = Object.keys(localDatabase);
      for (const name of collections) {
        counts[name] = (localDatabase as any)[name].length;
      }
    }
    
    return res.json({
      connected,
      uri: dbConfig.uri || "Not configured",
      dbName: dbConfig.dbName,
      collections,
      counts,
      mode: connected ? "MongoDB" : "Local JSON persistent fallback"
    });
  } catch (err: any) {
    res.json({
      connected: false,
      uri: dbConfig.uri || "Not configured",
      error: err.message,
      mode: "Local JSON persistent fallback"
    });
  }
});

app.post("/api/mongodb/connect", async (req, res) => {
  const { uri, dbName } = req.body;
  if (!uri) {
    return res.status(400).json({ success: false, error: "URI is required" });
  }
  
  try {
    const targetDbName = dbName || "nexus";
    await connectToMongo(uri, targetDbName);
    
    const logEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: "System",
      role: "Super Admin",
      action: "MongoDB Connected",
      details: `Connected to MongoDB database '${targetDbName}' successfully.`
    };
    
    if (mongoDb) {
      await mongoDb.collection("auditLogs").insertOne(logEntry);
    } else {
      localDatabase.auditLogs.unshift(logEntry);
      saveLocalDatabase();
    }

    return res.json({
      success: true,
      uri,
      dbName: targetDbName,
      message: `Successfully connected to MongoDB database: ${targetDbName}`
    });
  } catch (err: any) {
    console.error("Failed to connect to MongoDB:", err);
    return res.json({
      success: false,
      error: err.message || "Failed to connect to MongoDB"
    });
  }
});

app.post("/api/mongodb/reset", async (req, res) => {
  const { isDynamic, loadHistoric } = req.body;
  try {
    const sgReadiness = isDynamic ? Math.floor(Math.random() * 13) + 88 : 100;
    const deReadiness = isDynamic ? Math.floor(Math.random() * 14) + 82 : 92;
    const usReadiness = isDynamic ? Math.floor(Math.random() * 21) + 65 : 74;
    const jpReadiness = isDynamic ? Math.floor(Math.random() * 17) + 80 : 89;
    const frReadiness = isDynamic ? Math.floor(Math.random() * 21) + 60 : 65;

    const countriesList = [
      {
        id: "sg",
        name: "Singapore",
        flag: "🇸🇬",
        currency: "SGD (S$)",
        workingHours: 44,
        taxRules: "Progressive statutory tax rate from 0% up to 22%. CPF contribution required (up to 20% employee, up to 17% employer).",
        overtimePolicy: "1.5x hourly rate for hours worked over 44 per week. Excludes executive/managerial roles.",
        leavePolicy: "Minimum 14 days statutory paid annual leave + 14 days paid sick leave.",
        holidayCalendar: "11 Gazetted Public Holidays (Chinese New Year, Hari Raya, National Day, Christmas, etc.)",
        payrollCalendar: "Monthly payroll run on the 25th of each month.",
        workflow: ["HR Draft", "Finance Review", "Country Admin Certification", "Executive Release"],
        readinessScore: sgReadiness,
        complianceScore: isDynamic ? Math.floor(Math.random() * 11) + 90 : 100,
        dataQualityScore: isDynamic ? Math.floor(Math.random() * 11) + 90 : 98,
        status: isDynamic ? (sgReadiness > 95 ? "Completed" : "Pending Approval") : "Completed",
        riskLevel: isDynamic ? (sgReadiness < 80 ? "Medium" : "Low") : "Low"
      },
      {
        id: "de",
        name: "Germany",
        flag: "🇩🇪",
        currency: "EUR (€)",
        workingHours: 40,
        taxRules: "Statutory income tax (Lohnsteuer) from 14% to 45%. Solidaritätszuschlag (5.5%). Health, pension, and unemployment social security (~20% employee, ~20% employer).",
        overtimePolicy: "Max daily hours 8h. Extendable to 10h if average is 8h over 6 months. 11h consecutive rest required.",
        leavePolicy: "Minimum 20 days paid annual leave based on 5-day week.",
        holidayCalendar: "9-13 Public Holidays depending on federal state.",
        payrollCalendar: "Monthly payroll run on the 28th of each month.",
        workflow: ["HR Draft", "Compliance Verification", "Country Admin Certification", "Executive Release"],
        readinessScore: deReadiness,
        complianceScore: isDynamic ? Math.floor(Math.random() * 14) + 85 : 94,
        dataQualityScore: isDynamic ? Math.floor(Math.random() * 14) + 85 : 91,
        status: "Pending Approval",
        riskLevel: "Medium"
      },
      {
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
        readinessScore: usReadiness,
        complianceScore: isDynamic ? Math.floor(Math.random() * 21) + 70 : 82,
        dataQualityScore: isDynamic ? Math.floor(Math.random() * 18) + 75 : 86,
        status: isDynamic ? (usReadiness > 80 ? "Pending Verification" : "Validating") : "Validating",
        riskLevel: isDynamic ? (usReadiness < 70 ? "High" : "Medium") : "High"
      },
      {
        id: "jp",
        name: "Japan",
        flag: "🇯🇵",
        currency: "JPY (¥)",
        workingHours: 40,
        taxRules: "National income tax (5% to 45%), Local inhabitant tax (10%), Social Insurance (Health, Pension, Long-term care, Employment).",
        overtimePolicy: "Statutory premium is 1.25x for regular overtime, 1.35x for holiday work, 1.5x for late-night overtime (10pm-5am).",
        leavePolicy: "10 days paid leave after 6 months of service, scaling to 20 days.",
        holidayCalendar: "16 National Holidays (Golden Week, Mountain Day, Respect for the Aged Day, etc.)",
        payrollCalendar: "Monthly payroll run on the 25th of each month.",
        workflow: ["HR Draft", "Compliance Verification", "Executive Release"],
        readinessScore: jpReadiness,
        complianceScore: isDynamic ? Math.floor(Math.random() * 13) + 88 : 95,
        dataQualityScore: isDynamic ? Math.floor(Math.random() * 11) + 85 : 90,
        status: "Pending Verification",
        riskLevel: "Low"
      },
      {
        id: "fr",
        name: "France",
        flag: "🇫🇷",
        currency: "EUR (€)",
        workingHours: 35,
        taxRules: "Progressive personal tax, substantial employer social contributions (~45% of base wage), and employee contributions (~22%).",
        overtimePolicy: "Hours 36-43 paid at 1.25x premium. Hours 44+ paid at 1.5x premium. RTT days offered for working hours over 35h.",
        leavePolicy: "5 weeks (25 working days) paid annual leave + supplementary RTT days.",
        holidayCalendar: "11 Public Holidays (Bastille Day, Armistice Day, Labour Day, etc.)",
        payrollCalendar: "Monthly payroll run on the 30th of each month.",
        workflow: ["HR Draft", "Finance Review", "Country Admin Certification", "Executive Release"],
        readinessScore: frReadiness,
        complianceScore: isDynamic ? Math.floor(Math.random() * 16) + 70 : 78,
        dataQualityScore: isDynamic ? Math.floor(Math.random() * 16) + 75 : 81,
        status: "Draft",
        riskLevel: "Medium"
      },
      {
        id: "in",
        name: "India",
        flag: "🇮🇳",
        currency: "INR (₹)",
        workingHours: 48,
        taxRules: "Income tax slabs from 5% to 30% under New/Old Tax Regime. EPF contributions required (12% employee, 12% employer on basic pay). Professional Tax varies by state.",
        overtimePolicy: "Double the ordinary hourly wage rate for any work performed beyond 9 hours in a day or 48 hours in a week under Factories Act.",
        leavePolicy: "Minimum 15 days of earned leave (EL), 12 days of sick leave (SL) and casual leave (CL) as per Shops & Establishments Act.",
        holidayCalendar: "3 Mandatory National Holidays (Republic Day, Independence Day, Gandhi Jayanti) + 10-15 Gazetted and Restricted Public Holidays based on state.",
        payrollCalendar: "Monthly payroll run on the last working day of each month.",
        workflow: ["HR Draft", "Finance Review", "Country Admin Certification", "Executive Release"],
        readinessScore: 100,
        complianceScore: 100,
        dataQualityScore: 100,
        status: "Completed",
        riskLevel: "Low"
      }
    ];

    const employeesList = [
      { id: "EMP-1042", name: "Anna Weber", country: "Germany", department: "Engineering", title: "Principal Architect", salary: isDynamic ? 8500 + Math.floor((Math.random() * 2 - 1) * 1000) : 8500, status: "Active" },
      { id: "EMP-2109", name: "Marcus Tan", country: "Singapore", department: "Product", title: "Product Lead", salary: isDynamic ? 7800 + Math.floor((Math.random() * 2 - 1) * 800) : 7800, status: "Active" },
      { id: "EMP-0098", name: "Sarah Jenkins", country: "United States", department: "Sales", title: "VP Global Sales", salary: isDynamic ? 12500 + Math.floor((Math.random() * 2 - 1) * 1500) : 12500, status: "Active" },
      { id: "EMP-3045", name: "Hiroshi Sato", country: "Japan", department: "Operations", title: "Director of Ops", salary: isDynamic ? 11000 + Math.floor((Math.random() * 2 - 1) * 1200) : 11000, status: "Active" },
      { id: "EMP-1204", name: "Pierre Dubois", country: "France", department: "Marketing", title: "Senior Manager", salary: isDynamic ? 6200 + Math.floor((Math.random() * 2 - 1) * 500) : 6200, status: "Active" },
      { id: "EMP-8044", name: "Amit Patel", country: "India", department: "Engineering", title: "Lead Software Engineer", salary: isDynamic ? 120000 + Math.floor((Math.random() * 2 - 1) * 5000) : 120000, status: "Active" }
    ];

    if (loadHistoric) {
      employeesList.push(
        { id: "EMP-9001", name: "Thomas Müller", country: "Germany", department: "Engineering", title: "Senior Developer", salary: 7200, status: "Active" },
        { id: "EMP-9002", name: "Chloe Lim", country: "Singapore", department: "HR", title: "HR Business Partner", salary: 6500, status: "Active" },
        { id: "EMP-9003", name: "Robert Vance", country: "United States", department: "Sales", title: "Account Executive", salary: 8500, status: "Active" },
        { id: "EMP-9004", name: "Kenji Tanaka", country: "Japan", department: "Engineering", title: "Tech Lead", salary: 9500, status: "Active" },
        { id: "EMP-9005", name: "Lucie Bernard", country: "France", department: "Finance", title: "Payroll Specialist", salary: 5800, status: "Active" }
      );
    }

    const otHoursWeber = isDynamic ? Math.floor(Math.random() * 5) + 11 : 11.5;
    const cpfAdjustment = isDynamic ? Math.floor(Math.random() * 251) + 150 : 250;
    const baseSalJenkins = isDynamic ? 12500 + Math.floor((Math.random() * 2 - 1) * 2000) : 12500;

    const validationsList = [
      {
        id: "val-1",
        employeeId: "EMP-1042",
        employeeName: "Anna Weber",
        country: "Germany",
        issueType: "Overtime Violations",
        severity: "High",
        confidenceScore: isDynamic ? Math.floor(Math.random() * 10) + 90 : 98,
        explanation: `Worked ${otHoursWeber} hours in a single shift, exceeding the 10-hour daily threshold mandated by the Germany Working Time Act (Arbeitszeitgesetz).`,
        recommendedResolution: `Convert excess ${otHoursWeber - 10} hours into TOIL (Time-Off-In-Lieu) balance and issue a formal compliance bypass log.`,
        status: "Pending"
      },
      {
        id: "val-2",
        employeeId: "EMP-2109",
        employeeName: "Marcus Tan",
        country: "Singapore",
        issueType: "CPF Contribution Mismatch",
        severity: "Medium",
        confidenceScore: isDynamic ? Math.floor(Math.random() * 13) + 85 : 95,
        explanation: "HRMS records employee age as 54, triggering 20% employee CPF rate. Active payroll run calculated CPF at 15% based on stale Workday age bracket.",
        recommendedResolution: `Apply retroactive adjustment S$ ${cpfAdjustment}.00 to align payroll run with the true HRMS age status.`,
        status: "Pending"
      },
      {
        id: "val-3",
        employeeId: "EMP-0098",
        employeeName: "Sarah Jenkins",
        country: "United States",
        issueType: "Base Salary Variance",
        severity: "High",
        confidenceScore: isDynamic ? Math.floor(Math.random() * 16) + 80 : 92,
        explanation: `Ingested base salary of $${baseSalJenkins.toLocaleString()}.00 for the month is higher than the HRMS active contract base salary.`,
        recommendedResolution: "Reject the ingested timesheet rate and revert to the contract base salary, or request Compensation Team approval.",
        status: "Pending"
      }
    ];

    const reconciliationsList = [
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
      }
    ];

    const auditLogsList = [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: "System",
        role: "Super Admin",
        action: "Database Reset & Seeded",
        details: `Re-seeded all operational data (Dynamic: ${isDynamic}, Load Historic: ${loadHistoric}) successfully.`
      }
    ];

    if (mongoDb) {
      await mongoDb.collection("countries").deleteMany({});
      await mongoDb.collection("countries").insertMany(countriesList);

      await mongoDb.collection("employees").deleteMany({});
      await mongoDb.collection("employees").insertMany(employeesList);

      await mongoDb.collection("validationResults").deleteMany({});
      await mongoDb.collection("validationResults").insertMany(validationsList);

      await mongoDb.collection("reconciliationResults").deleteMany({});
      await mongoDb.collection("reconciliationResults").insertMany(reconciliationsList);

      await mongoDb.collection("auditLogs").deleteMany({});
      await mongoDb.collection("auditLogs").insertMany(auditLogsList);
    } else {
      localDatabase.countries = countriesList;
      localDatabase.employees = employeesList;
      localDatabase.validationResults = validationsList;
      localDatabase.reconciliationResults = reconciliationsList;
      localDatabase.auditLogs = auditLogsList;
      saveLocalDatabase();
    }

    return res.json({
      success: true,
      message: `Database successfully reset & re-seeded (Dynamic: ${isDynamic}, Load Historic: ${loadHistoric})`
    });
  } catch (err: any) {
    console.error("Failed to reset database:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Countries REST API
app.get("/api/countries", async (req, res) => {
  try {
    if (mongoDb) {
      const list = await mongoDb.collection("countries").find({}).toArray();
      return res.json(list);
    }
    return res.json(localDatabase.countries);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/countries", async (req, res) => {
  try {
    const country = req.body;
    if (mongoDb) {
      await mongoDb.collection("countries").updateOne(
        { id: country.id },
        { $set: country },
        { upsert: true }
      );
    } else {
      const idx = localDatabase.countries.findIndex(c => c.id === country.id);
      if (idx >= 0) {
        localDatabase.countries[idx] = country;
      } else {
        localDatabase.countries.push(country);
      }
      saveLocalDatabase();
    }
    return res.json({ success: true, country });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Employees REST API
app.get("/api/employees", async (req, res) => {
  try {
    if (mongoDb) {
      const list = await mongoDb.collection("employees").find({}).toArray();
      return res.json(list);
    }
    return res.json(localDatabase.employees);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/employees", async (req, res) => {
  try {
    const emp = req.body;
    if (mongoDb) {
      await mongoDb.collection("employees").updateOne(
        { id: emp.id },
        { $set: emp },
        { upsert: true }
      );
    } else {
      const idx = localDatabase.employees.findIndex(e => e.id === emp.id);
      if (idx >= 0) {
        localDatabase.employees[idx] = emp;
      } else {
        localDatabase.employees.push(emp);
      }
      saveLocalDatabase();
    }
    return res.json({ success: true, employee: emp });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/employees/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (mongoDb) {
      await mongoDb.collection("employees").deleteOne({ id: id });
    } else {
      localDatabase.employees = localDatabase.employees.filter(e => e.id !== id);
      saveLocalDatabase();
    }
    return res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Validation Results REST API
app.get("/api/validation-results", async (req, res) => {
  try {
    if (mongoDb) {
      const list = await mongoDb.collection("validationResults").find({}).toArray();
      return res.json(list);
    }
    return res.json(localDatabase.validationResults);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/validation-results", async (req, res) => {
  try {
    const v = req.body;
    if (mongoDb) {
      await mongoDb.collection("validationResults").updateOne(
        { id: v.id },
        { $set: v },
        { upsert: true }
      );
    } else {
      const idx = localDatabase.validationResults.findIndex(item => item.id === v.id);
      if (idx >= 0) {
        localDatabase.validationResults[idx] = v;
      } else {
        localDatabase.validationResults.push(v);
      }
      saveLocalDatabase();
    }
    return res.json({ success: true, result: v });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/validation-results/resolve", async (req, res) => {
  try {
    const { id, status } = req.body;
    if (mongoDb) {
      await mongoDb.collection("validationResults").updateOne(
        { id: id },
        { $set: { status: status } }
      );
    } else {
      localDatabase.validationResults = localDatabase.validationResults.map(item => 
        item.id === id ? { ...item, status: status } : item
      );
      saveLocalDatabase();
    }
    return res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reconciliation Results REST API
app.get("/api/reconciliation-results", async (req, res) => {
  try {
    if (mongoDb) {
      const list = await mongoDb.collection("reconciliationResults").find({}).toArray();
      return res.json(list);
    }
    return res.json(localDatabase.reconciliationResults);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/reconciliation-results", async (req, res) => {
  try {
    const r = req.body;
    if (mongoDb) {
      await mongoDb.collection("reconciliationResults").updateOne(
        { id: r.id },
        { $set: r },
        { upsert: true }
      );
    } else {
      const idx = localDatabase.reconciliationResults.findIndex(item => item.id === r.id);
      if (idx >= 0) {
        localDatabase.reconciliationResults[idx] = r;
      } else {
        localDatabase.reconciliationResults.push(r);
      }
      saveLocalDatabase();
    }
    return res.json({ success: true, result: r });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Audit Logs REST API
app.get("/api/audit-logs", async (req, res) => {
  try {
    if (mongoDb) {
      const list = await mongoDb.collection("auditLogs").find({}).sort({ timestamp: -1 }).toArray();
      return res.json(list);
    }
    return res.json([...localDatabase.auditLogs].sort((a,b) => b.timestamp.localeCompare(a.timestamp)));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/audit-logs", async (req, res) => {
  try {
    const log = req.body;
    log.id = log.id || `audit-${Date.now()}`;
    log.timestamp = log.timestamp || new Date().toISOString();
    if (mongoDb) {
      await mongoDb.collection("auditLogs").insertOne(log);
    } else {
      localDatabase.auditLogs.unshift(log);
      saveLocalDatabase();
    }
    return res.json({ success: true, log });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------------
// ENTERPRISE AUTHENTICATION & USER MANAGEMENT MODULES
// -------------------------------------------------------------------

const activeOtps = new Map<string, { otp: string; expires: number; attempts: number }>();

// GET all users
app.get("/api/users", async (req, res) => {
  try {
    if (mongoDb) {
      const list = await mongoDb.collection("users").find({}).toArray();
      return res.json(list);
    }
    return res.json(localDatabase.users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE or UPDATE a user
app.post("/api/users", async (req, res) => {
  try {
    const user = req.body;
    user.id = user.id || `user-${Date.now()}`;
    user.failedLoginAttempts = user.failedLoginAttempts || 0;
    user.password = user.password || "Password123!";
    user.mfaStatus = user.mfaEnabled ? "Enabled" : "Disabled";
    user.passwordExpiryDate = user.passwordExpiryDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    user.status = user.status || "Active";
    user.lastLogin = user.lastLogin || "Never";

    if (mongoDb) {
      await mongoDb.collection("users").updateOne(
        { id: user.id },
        { $set: user },
        { upsert: true }
      );
    } else {
      const idx = localDatabase.users.findIndex(u => u.id === user.id);
      if (idx >= 0) {
        localDatabase.users[idx] = user;
      } else {
        localDatabase.users.push(user);
      }
      saveLocalDatabase();
    }
    return res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE user
app.delete("/api/users/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (mongoDb) {
      await mongoDb.collection("users").deleteOne({ id: id });
    } else {
      localDatabase.users = localDatabase.users.filter(u => u.id !== id);
      saveLocalDatabase();
    }
    return res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE user status (Activate/Deactivate/Lock/Unlock)
app.post("/api/users/:id/status", async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body; // "Active" | "Deactivated" | "Locked"
    if (mongoDb) {
      const updateObj: any = { status };
      if (status === "Active") {
        updateObj.failedLoginAttempts = 0;
      }
      await mongoDb.collection("users").updateOne({ id }, { $set: updateObj });
    } else {
      const user = localDatabase.users.find(u => u.id === id);
      if (user) {
        user.status = status;
        if (status === "Active") {
          user.failedLoginAttempts = 0;
        }
        saveLocalDatabase();
      }
    }
    return res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// RESET USER PASSWORD
app.post("/api/users/:id/reset-password", async (req, res) => {
  try {
    const id = req.params.id;
    const { password } = req.body;
    const newPwd = password || "Password123!";
    if (mongoDb) {
      await mongoDb.collection("users").updateOne({ id }, { $set: { password: newPwd, failedLoginAttempts: 0, status: "Active" } });
    } else {
      const user = localDatabase.users.find(u => u.id === id);
      if (user) {
        user.password = newPwd;
        user.failedLoginAttempts = 0;
        user.status = "Active";
        saveLocalDatabase();
      }
    }
    return res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET permissions matrix
app.get("/api/permissions", async (req, res) => {
  try {
    if (mongoDb) {
      const list = await mongoDb.collection("permissions").find({}).toArray();
      return res.json(list);
    }
    return res.json(localDatabase.permissions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE permissions matrix
app.post("/api/permissions", async (req, res) => {
  try {
    const matrix = req.body;
    if (mongoDb) {
      await mongoDb.collection("permissions").deleteMany({});
      await mongoDb.collection("permissions").insertMany(matrix);
    } else {
      localDatabase.permissions = matrix;
      saveLocalDatabase();
    }
    return res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET login activities history
app.get("/api/login-logs", async (req, res) => {
  try {
    if (mongoDb) {
      const list = await mongoDb.collection("loginLogs").find({}).sort({ timestamp: -1 }).toArray();
      return res.json(list);
    }
    return res.json([...localDatabase.loginLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new login log entry
app.post("/api/login-logs", async (req, res) => {
  try {
    const log = req.body;
    log.id = log.id || `log-${Date.now()}`;
    log.timestamp = log.timestamp || new Date().toISOString();
    if (mongoDb) {
      await mongoDb.collection("loginLogs").insertOne(log);
    } else {
      localDatabase.loginLogs.unshift(log);
      saveLocalDatabase();
    }
    return res.json({ success: true, log });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// MAIN AUTH LOGIN ENDPOINT (Supports SSO Simulation, Password checks, Multi-Factor check & locks)
app.post("/api/auth/login", async (req, res) => {
  const { email, password, isSso, browser, device, ip } = req.body;
  try {
    const usersList = mongoDb 
      ? await mongoDb.collection("users").find({}).toArray()
      : localDatabase.users;
    
    const user = usersList.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Log failed login
      const log = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        email,
        name: "Unknown Guest",
        browser: browser || "Chrome",
        device: device || "Windows Desktop",
        ip: ip || "127.0.0.1",
        method: isSso ? "Microsoft SSO" : "Password",
        status: "Failed",
        details: "Entered email is not registered in the Enterprise directory."
      };
      if (mongoDb) await mongoDb.collection("loginLogs").insertOne(log);
      else { localDatabase.loginLogs.unshift(log); saveLocalDatabase(); }

      return res.status(401).json({ success: false, error: "The entered email address is not registered in the NEXUS corporate directory." });
    }

    if (user.status === "Locked") {
      return res.status(403).json({ success: false, error: "This enterprise account has been LOCKED due to security policies or too many failed login attempts. Please contact a Super Admin to unlock your profile." });
    }

    if (user.status === "Deactivated") {
      return res.status(403).json({ success: false, error: "This enterprise account has been DEACTIVATED. Please contact HR or a Super Admin to reactivate your credentials." });
    }

    if (isSso) {
      // SSO Simulation
      if (user.mfaEnabled) {
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        activeOtps.set(user.email.toLowerCase(), {
          otp: otpCode,
          expires: Date.now() + 5 * 60 * 1000,
          attempts: 0
        });

        // Seed audit log
        const audit = {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: user.name,
          role: user.roles[0] || "Employee",
          action: "MFA OTP Sent (SSO)",
          details: `Simulated Email OTP [${otpCode}] sent to ${user.email} (expires in 5m).`
        };
        if (mongoDb) await mongoDb.collection("auditLogs").insertOne(audit);
        else { localDatabase.auditLogs.unshift(audit); saveLocalDatabase(); }

        return res.json({
          success: true,
          mfaRequired: true,
          email: user.email,
          simulatedOtp: otpCode
        });
      } else {
        user.lastLogin = new Date().toISOString();
        if (mongoDb) await mongoDb.collection("users").updateOne({ id: user.id }, { $set: { lastLogin: user.lastLogin } });
        else saveLocalDatabase();

        const log = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          email: user.email,
          name: user.name,
          browser: browser || "Chrome",
          device: device || "Windows Desktop",
          ip: ip || "127.0.0.1",
          method: "Microsoft SSO",
          status: "Success"
        };
        if (mongoDb) await mongoDb.collection("loginLogs").insertOne(log);
        else { localDatabase.loginLogs.unshift(log); saveLocalDatabase(); }

        return res.json({
          success: true,
          mfaRequired: false,
          user
        });
      }
    } else {
      // Standard Password Login
      if (user.password !== password) {
        const attempts = (user.failedLoginAttempts || 0) + 1;
        const isLockedNow = attempts >= 5;
        const newStatus = isLockedNow ? "Locked" : user.status;

        if (mongoDb) {
          await mongoDb.collection("users").updateOne({ id: user.id }, { $set: { failedLoginAttempts: attempts, status: newStatus } });
        } else {
          user.failedLoginAttempts = attempts;
          user.status = newStatus;
          saveLocalDatabase();
        }

        const log = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          email: user.email,
          name: user.name,
          browser: browser || "Chrome",
          device: device || "Windows Desktop",
          ip: ip || "127.0.0.1",
          method: "Password",
          status: "Failed",
          details: isLockedNow 
            ? "Incorrect password. Account locked automatically (Max attempts exceeded)."
            : `Incorrect password. Attempt ${attempts} of 5.`
        };
        if (mongoDb) await mongoDb.collection("loginLogs").insertOne(log);
        else { localDatabase.loginLogs.unshift(log); saveLocalDatabase(); }

        if (isLockedNow) {
          return res.status(403).json({ success: false, error: "The account has been locked due to 5 consecutive failed password attempts. Please contact a Super Admin to unlock your profile." });
        }

        return res.status(401).json({ success: false, error: `Invalid password. Attempt ${attempts} of 5. The account will lock after 5 failed attempts.` });
      }

      // Password matches
      if (user.mfaEnabled) {
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        activeOtps.set(user.email.toLowerCase(), {
          otp: otpCode,
          expires: Date.now() + 5 * 60 * 1000,
          attempts: 0
        });

        const audit = {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: user.name,
          role: user.roles[0] || "Employee",
          action: "MFA OTP Sent (Password)",
          details: `Simulated Email OTP [${otpCode}] sent to ${user.email} (expires in 5m).`
        };
        if (mongoDb) await mongoDb.collection("auditLogs").insertOne(audit);
        else { localDatabase.auditLogs.unshift(audit); saveLocalDatabase(); }

        return res.json({
          success: true,
          mfaRequired: true,
          email: user.email,
          simulatedOtp: otpCode
        });
      } else {
        user.lastLogin = new Date().toISOString();
        user.failedLoginAttempts = 0;
        if (mongoDb) {
          await mongoDb.collection("users").updateOne({ id: user.id }, { $set: { lastLogin: user.lastLogin, failedLoginAttempts: 0 } });
        } else saveLocalDatabase();

        const log = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          email: user.email,
          name: user.name,
          browser: browser || "Chrome",
          device: device || "Windows Desktop",
          ip: ip || "127.0.0.1",
          method: "Password",
          status: "Success"
        };
        if (mongoDb) await mongoDb.collection("loginLogs").insertOne(log);
        else { localDatabase.loginLogs.unshift(log); saveLocalDatabase(); }

        return res.json({
          success: true,
          mfaRequired: false,
          user
        });
      }
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// RESEND MFA OTP
app.post("/api/auth/resend-otp", async (req, res) => {
  const { email } = req.body;
  try {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    activeOtps.set(email.toLowerCase(), {
      otp: otpCode,
      expires: Date.now() + 5 * 60 * 1000,
      attempts: 0
    });

    const audit = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: "System",
      role: "Security Service",
      action: "MFA OTP Resent",
      details: `Simulated Email OTP [${otpCode}] re-sent to ${email} (expires in 5m).`
    };
    if (mongoDb) await mongoDb.collection("auditLogs").insertOne(audit);
    else { localDatabase.auditLogs.unshift(audit); saveLocalDatabase(); }

    return res.json({ success: true, simulatedOtp: otpCode });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// VERIFY MFA OTP
app.post("/api/auth/verify-otp", async (req, res) => {
  const { email, otp, browser, device, ip } = req.body;
  try {
    const activeOtp = activeOtps.get(email.toLowerCase());
    const usersList = mongoDb ? await mongoDb.collection("users").find({}).toArray() : localDatabase.users;
    const user = usersList.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(401).json({ success: false, error: "Enterprise user session not found." });
    }

    if (!activeOtp) {
      return res.status(400).json({ success: false, error: "No active verification session found. Please request a new OTP." });
    }

    if (Date.now() > activeOtp.expires) {
      return res.status(400).json({ success: false, error: "Verification code has expired. Please click 'Resend OTP'." });
    }

    if (activeOtp.otp !== otp) {
      activeOtp.attempts += 1;
      const maxAttempts = 3;
      if (activeOtp.attempts >= maxAttempts) {
        // Lock account
        if (mongoDb) {
          await mongoDb.collection("users").updateOne({ id: user.id }, { $set: { status: "Locked" } });
        } else {
          user.status = "Locked";
          saveLocalDatabase();
        }

        const log = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          email: user.email,
          name: user.name,
          browser: browser || "Chrome",
          device: device || "Windows Desktop",
          ip: ip || "127.0.0.1",
          method: "MFA OTP Verification",
          status: "Locked",
          details: "Locked due to 3 failed MFA code attempts."
        };
        if (mongoDb) await mongoDb.collection("loginLogs").insertOne(log);
        else { localDatabase.loginLogs.unshift(log); saveLocalDatabase(); }

        activeOtps.delete(email.toLowerCase());
        return res.status(403).json({ success: false, error: "Account LOCKED! You entered the wrong verification code 3 times. Please contact your Super Admin to unlock your profile." });
      }

      return res.status(401).json({ success: false, error: `Incorrect verification code. Attempt ${activeOtp.attempts} of ${maxAttempts}.` });
    }

    // Success!
    activeOtps.delete(email.toLowerCase());
    user.lastLogin = new Date().toISOString();
    user.failedLoginAttempts = 0;
    if (mongoDb) {
      await mongoDb.collection("users").updateOne({ id: user.id }, { $set: { lastLogin: user.lastLogin, failedLoginAttempts: 0 } });
    } else saveLocalDatabase();

    const log = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      email: user.email,
      name: user.name,
      browser: browser || "Chrome",
      device: device || "Windows Desktop",
      ip: ip || "127.0.0.1",
      method: "MFA OTP Verification",
      status: "Success"
    };
    if (mongoDb) await mongoDb.collection("loginLogs").insertOne(log);
    else { localDatabase.loginLogs.unshift(log); saveLocalDatabase(); }

    return res.json({
      success: true,
      user
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ENTERPRISE REGISTER ENDPOINT (Supports signing up custom users)
app.post("/api/auth/register", async (req, res) => {
  const { email, password, name, department, country, roles } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ success: false, error: "Please provide your corporate email, name, and a password." });
  }

  try {
    const usersList = mongoDb ? await mongoDb.collection("users").find({}).toArray() : localDatabase.users;
    const userExists = usersList.some((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (userExists) {
      return res.status(400).json({ success: false, error: "This corporate email address is already registered in the NEXUS directory." });
    }

    // Default to Super Admin for ronaksurve@gmail.com, otherwise default to Payroll Admin unless roles are specified
    const assignedRoles = roles || (email.toLowerCase() === "ronaksurve@gmail.com" ? ["Super Admin", "Executive Leadership"] : ["Payroll Administrator"]);
    const newUser = {
      id: `user-${Date.now()}`,
      name,
      psNumber: `PS-${Math.floor(10000 + Math.random() * 90000)}`,
      email,
      department: department || "Operations",
      country: country || "India",
      roles: assignedRoles,
      status: "Active",
      password,
      lastLogin: new Date().toISOString(),
      failedLoginAttempts: 0,
      mfaEnabled: true,
      passwordExpiryDate: "2027-12-31",
      mfaStatus: "Enabled"
    };

    if (mongoDb) {
      await mongoDb.collection("users").insertOne(newUser);
    } else {
      localDatabase.users.push(newUser);
      saveLocalDatabase();
    }

    const log = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      email: newUser.email,
      name: newUser.name,
      browser: "Registration Portal",
      device: "Web Browser",
      ip: req.ip || "127.0.0.1",
      method: "Registration",
      status: "Success",
      details: `New enterprise account registered successfully with roles: ${assignedRoles.join(", ")}.`
    };
    if (mongoDb) await mongoDb.collection("loginLogs").insertOne(log);
    else { localDatabase.loginLogs.unshift(log); saveLocalDatabase(); }

    return res.json({
      success: true,
      message: "Your corporate account has been successfully registered. You can now sign in using your credentials.",
      user: newUser
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PASSWORD RESET INITIATION (FORGOT PASSWORD)
app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const usersList = mongoDb ? await mongoDb.collection("users").find({}).toArray() : localDatabase.users;
    const user = usersList.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(404).json({ success: false, error: "The entered email address is not registered in the NEXUS Directory." });
    }

    if (user.status === "Locked") {
      return res.status(403).json({ success: false, error: "This profile is locked. Please contact your Super Admin to unlock and reset your credentials." });
    }

    const resetToken = Math.random().toString(36).substring(2, 15);
    const resetLink = `/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    const audit = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: user.name,
      role: user.roles[0] || "Employee",
      action: "Forgot Password Ticket Created",
      details: `Simulated password reset email sent. Clickable Link: ${resetLink}`
    };
    if (mongoDb) await mongoDb.collection("auditLogs").insertOne(audit);
    else { localDatabase.auditLogs.unshift(audit); saveLocalDatabase(); }

    return res.json({
      success: true,
      message: "Security check passed. A secure reset link has been dispatched.",
      resetLink,
      email: user.email
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// SUBMIT SECURE PASSWORD RESET LINK
app.post("/api/auth/reset-password-link", async (req, res) => {
  const { email, password } = req.body;
  try {
    const usersList = mongoDb ? await mongoDb.collection("users").find({}).toArray() : localDatabase.users;
    const user = usersList.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(404).json({ success: false, error: "The user profile could not be validated." });
    }

    if (mongoDb) {
      await mongoDb.collection("users").updateOne(
        { id: user.id },
        { $set: { password: password, failedLoginAttempts: 0, status: "Active" } }
      );
    } else {
      const u = localDatabase.users.find(item => item.id === user.id);
      if (u) {
        u.password = password;
        u.failedLoginAttempts = 0;
        u.status = "Active";
        saveLocalDatabase();
      }
    }

    const log = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      email: user.email,
      name: user.name,
      browser: "System Security Portal",
      device: "Enterprise Recovery",
      ip: "127.0.0.1",
      method: "Password Reset Link",
      status: "Success",
      details: "Password reset completed successfully via secure recovery link."
    };
    if (mongoDb) await mongoDb.collection("loginLogs").insertOne(log);
    else { localDatabase.loginLogs.unshift(log); saveLocalDatabase(); }

    return res.json({ success: true, message: "Your password has been reset successfully! You can now log in with your new credentials." });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------------
// VITE DEV SERVER OR STATIC ASSETS SERVING FOR PRODUCTION
// -------------------------------------------------------------------
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Mounted Vite development middleware.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled static assets in production mode.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NEXUS full-stack server running at http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Critical error starting Express backend:", error);
});
