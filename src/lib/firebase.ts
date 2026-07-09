import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  addDoc, 
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from "firebase/firestore";

// Read credentials from our config
const firebaseConfig = {
  projectId: "rugged-folio-6p928",
  appId: "1:1020163340559:web:b89f7761e442643009267a",
  apiKey: "AIzaSyABqdjRrvaQMTGQf5q60P79iHI5dQjYH1w",
  authDomain: "rugged-folio-6p928.firebaseapp.com",
  // Specify custom firestore database ID from our config
  databaseId: "ai-studio-2ef7c472-b495-4f05-98fc-714c54737d6d",
  storageBucket: "rugged-folio-6p928.firebasestorage.app",
  messagingSenderId: "1020163340559"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Helper to check and seed initial enterprise data on first run
export async function seedInitialDatabase(isDynamic: boolean = false, forceReset: boolean = false) {
  try {
    const countriesRef = collection(db, "Countries");
    const snapshot = await getDocs(countriesRef);
    
    // If we already have seeded data and we're not forcing a reset, don't re-seed
    if (!snapshot.empty && !forceReset) {
      console.log("Database already initialized.");
      return;
    }

    console.log(`Seeding database (Dynamic: ${isDynamic}, ForceReset: ${forceReset})...`);

    // Force wipe if requested
    if (forceReset) {
      const COLLECTIONS_TO_WIPE = [
        "Countries", 
        "Employees", 
        "Rules", 
        "PayrollCycles", 
        "ValidationResults", 
        "ReconciliationResults", 
        "AuditLogs", 
        "KPIs",
        "HistoricalPayroll"
      ];

      for (const colName of COLLECTIONS_TO_WIPE) {
        try {
          const colRef = collection(db, colName);
          const snap = await getDocs(colRef);
          for (const d of snap.docs) {
            await deleteDoc(doc(db, colName, d.id));
          }
        } catch (colErr) {
          console.warn(`Could not clear collection ${colName}:`, colErr);
        }
      }
      console.log("Wiped database collections cleanly.");
    }

    // Dynamic random pool generators
    const getRandomScore = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const getRandomAmount = (base: number, variance: number) => base + Math.floor((Math.random() * 2 - 1) * variance);
    
    const now = new Date();
    const currentMonthYear = now.toLocaleString("en-US", { month: "long", year: "numeric" }); // e.g. "July 2026"
    const currentShortMonth = now.toLocaleString("en-US", { month: "short" }); // e.g. "Jul"
    
    // Previous month computation
    const prevDate = new Date();
    prevDate.setMonth(now.getMonth() - 1);
    const prevMonthYear = prevDate.toLocaleString("en-US", { month: "long", year: "numeric" });
    const prevShortMonth = prevDate.toLocaleString("en-US", { month: "short" });

    // 1. Seed Countries & Rule Packs
    const sgReadiness = isDynamic ? getRandomScore(88, 100) : 100;
    const deReadiness = isDynamic ? getRandomScore(82, 95) : 92;
    const usReadiness = isDynamic ? getRandomScore(65, 85) : 74;
    const jpReadiness = isDynamic ? getRandomScore(80, 96) : 89;
    const frReadiness = isDynamic ? getRandomScore(60, 80) : 65;

    const initialCountries = [
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
        complianceScore: isDynamic ? getRandomScore(90, 100) : 100,
        dataQualityScore: isDynamic ? getRandomScore(90, 100) : 98,
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
        holidayCalendar: "9-13 Public Holidays depending on federal state (Bavaria vs Berlin).",
        payrollCalendar: "Monthly payroll run on the 28th of each month.",
        workflow: ["HR Draft", "Compliance Verification", "Country Admin Certification", "Executive Release"],
        readinessScore: deReadiness,
        complianceScore: isDynamic ? getRandomScore(85, 98) : 94,
        dataQualityScore: isDynamic ? getRandomScore(85, 98) : 91,
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
        complianceScore: isDynamic ? getRandomScore(70, 90) : 82,
        dataQualityScore: isDynamic ? getRandomScore(75, 92) : 86,
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
        complianceScore: isDynamic ? getRandomScore(88, 100) : 95,
        dataQualityScore: isDynamic ? getRandomScore(85, 95) : 90,
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
        complianceScore: isDynamic ? getRandomScore(70, 85) : 78,
        dataQualityScore: isDynamic ? getRandomScore(75, 90) : 81,
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

    for (const c of initialCountries) {
      await setDoc(doc(db, "Countries", c.id), c);
    }

    // 2. Seed Employees
    const initialEmployees = [
      { id: "EMP-1042", name: "Anna Weber", country: "Germany", department: "Engineering", title: "Principal Architect", salary: isDynamic ? getRandomAmount(8500, 1000) : 8500, status: "Active" },
      { id: "EMP-2109", name: "Marcus Tan", country: "Singapore", department: "Product", title: "Product Lead", salary: isDynamic ? getRandomAmount(7800, 800) : 7800, status: "Active" },
      { id: "EMP-0098", name: "Sarah Jenkins", country: "United States", department: "Sales", title: "VP Global Sales", salary: isDynamic ? getRandomAmount(12500, 1500) : 12500, status: "Active" },
      { id: "EMP-3045", name: "Hiroshi Sato", country: "Japan", department: "Operations", title: "Director of Ops", salary: isDynamic ? getRandomAmount(11000, 1200) : 11000, status: "Active" },
      { id: "EMP-1204", name: "Pierre Dubois", country: "France", department: "Marketing", title: "Senior Manager", salary: isDynamic ? getRandomAmount(6200, 500) : 6200, status: "Active" },
      { id: "EMP-8044", name: "Amit Patel", country: "India", department: "Engineering", title: "Lead Software Engineer", salary: isDynamic ? getRandomAmount(120000, 5000) : 120000, status: "Active" }
    ];

    for (const emp of initialEmployees) {
      await setDoc(doc(db, "Employees", emp.id), emp);
    }

    // 3. Seed Rule Packs (linked to Country Rules)
    const initialRules = [
      { id: "rule-de-ot", country: "Germany", code: "GER_DAILY_MAX_HOURS", category: "Overtime", limit: 10, penalty: "High statutory fine", description: "Enforces 10 hours daily threshold limit by law." },
      { id: "rule-sg-cpf", country: "Singapore", code: "SG_CPF_CONTRIB", category: "Taxation", limit: 20, penalty: "Late payment interest", description: "Enforces 20% CPF contribution rate on employees under 55." },
      { id: "rule-us-ot", country: "United States", code: "US_FLSA_OT", category: "Overtime", limit: 40, penalty: "Department of Labor citation", description: "Requires 1.5x premium pay for working above 40 hours per week." }
    ];

    for (const rule of initialRules) {
      await setDoc(doc(db, "Rules", rule.id), rule);
    }

    // 4. Seed Payroll Cycles
    const globalVal = isDynamic ? getRandomAmount(1420500, 150000) : 1420500;
    const prevGlobalVal = isDynamic ? getRandomAmount(1390400, 120000) : 1390400;

    const initialCycles = [
      { id: "cycle-active-global", month: currentMonthYear, status: "Active", globalReadyScore: Math.round((sgReadiness + deReadiness + usReadiness + jpReadiness + frReadiness) / 5), activeRuns: 5, totalPayrollValue: globalVal, pendingApprovalsCount: isDynamic ? getRandomScore(1, 6) : 3 },
      { id: "cycle-previous-global", month: prevMonthYear, status: "Closed", globalReadyScore: 98, activeRuns: 0, totalPayrollValue: prevGlobalVal, pendingApprovalsCount: 0 }
    ];

    for (const cy of initialCycles) {
      await setDoc(doc(db, "PayrollCycles", cy.id), cy);
    }

    // 5. Seed Validation Results
    const otHoursWeber = isDynamic ? getRandomScore(11, 15) : 11.5;
    const cpfAdjustment = isDynamic ? getRandomScore(150, 400) : 250;
    const baseSalJenkins = isDynamic ? getRandomAmount(12500, 2000) : 12500;

    const initialValidations = [
      {
        id: "val-1",
        employeeId: "EMP-1042",
        employeeName: "Anna Weber",
        country: "Germany",
        issueType: "Overtime Violations",
        severity: "High",
        confidenceScore: isDynamic ? getRandomScore(90, 99) : 98,
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
        confidenceScore: isDynamic ? getRandomScore(85, 97) : 95,
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
        confidenceScore: isDynamic ? getRandomScore(80, 95) : 92,
        explanation: `Ingested base salary of $${baseSalJenkins.toLocaleString()}.00 for the month is higher than the HRMS active contract base salary.`,
        recommendedResolution: "Reject the ingested timesheet rate and revert to the contract base salary, or request Compensation Team approval.",
        status: "Pending"
      }
    ];

    for (const v of initialValidations) {
      await setDoc(doc(db, "ValidationResults", v.id), v);
    }

    // 6. Seed Reconciliation Results
    const initialReconciliation = [
      {
        id: "rec-1",
        employeeId: "EMP-1042",
        name: "Anna Weber",
        source: "Timesheets (168h)",
        target: "HRMS (160h)",
        discrepancy: "+8.0 hrs Variance",
        type: "Overtime Reconciliation",
        confidence: isDynamic ? getRandomScore(88, 97) : 94,
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
        confidence: isDynamic ? getRandomScore(80, 93) : 89,
        aiRecommendation: "Approve S$ 300.00 standard limit and route S$ 120.00 exception for Executive Sign-off due to offsite client dinner.",
        status: "Pending"
      }
    ];

    for (const r of initialReconciliation) {
      await setDoc(doc(db, "ReconciliationResults", r.id), r);
    }

    // 7. Seed Audit Logs
    const initialAudits = [
      { id: "aud-001", timestamp: new Date(now.getTime() - 3600000 * 3).toISOString(), user: "Ronak Surve (Super Admin)", role: "Super Admin", action: "System Ingestion initiated for German entity", details: "Ingested 82 timecards, updated 2 records" },
      { id: "aud-002", timestamp: new Date(now.getTime() - 3600000 * 2).toISOString(), user: "NEXUS Agent Layer", role: "AI Validation Agent", action: "Automated scan performed", details: "Scanned 1420 files, identified 5 validation exceptions" },
      { id: "aud-003", timestamp: new Date(now.getTime() - 3600000 * 1).toISOString(), user: "Elena Müller (Country Admin)", role: "Country Admin", action: "Rule Overtime Override updated", details: "Overtime grace limit adjusted for Berlin operations" }
    ];

    for (const a of initialAudits) {
      await setDoc(doc(db, "AuditLogs", a.id), a);
    }

    // 8. Seed KPIs & Settings
    await setDoc(doc(db, "KPIs", "global"), {
      readinessScore: Math.round((sgReadiness + deReadiness + usReadiness + jpReadiness + frReadiness) / 5),
      complianceScore: isDynamic ? getRandomScore(85, 95) : 92,
      dataQualityScore: isDynamic ? getRandomScore(82, 94) : 89,
      totalIssues: isDynamic ? getRandomScore(3, 8) : 5,
      resolvedIssues: isDynamic ? getRandomScore(10, 25) : 12,
      pendingApprovals: isDynamic ? getRandomScore(2, 7) : 3,
      cycleProgress: isDynamic ? getRandomScore(60, 90) : 75
    });

    console.log("Database seeded successfully!");
  } catch (err) {
    console.error("Error during initial database seed:", err);
  }
}

// Seeding historic years of database to trigger Reports retrospectively!
export async function seedHistoricalDatabase() {
  try {
    console.log("Seeding historical 5-year payroll base data (2021-2025)...");
    
    const historicalRuns = [
      // 2021 runs
      { id: "hist-2021-06", year: 2021, month: "June", totalVolume: 1104200, accuracyRate: 94.2, employeesCount: 180, issuesResolved: 42, taxAdjusted: 12400 },
      { id: "hist-2021-12", year: 2021, month: "December", totalVolume: 1150800, accuracyRate: 94.8, employeesCount: 185, issuesResolved: 51, taxAdjusted: 14200 },
      // 2022 runs
      { id: "hist-2022-06", year: 2022, month: "June", totalVolume: 1205300, accuracyRate: 95.7, employeesCount: 198, issuesResolved: 35, taxAdjusted: 9800 },
      { id: "hist-2022-12", year: 2022, month: "December", totalVolume: 1245000, accuracyRate: 96.1, employeesCount: 204, issuesResolved: 38, taxAdjusted: 11200 },
      // 2023 runs
      { id: "hist-2023-06", year: 2023, month: "June", totalVolume: 1290000, accuracyRate: 96.9, employeesCount: 215, issuesResolved: 24, taxAdjusted: 8500 },
      { id: "hist-2023-12", year: 2023, month: "December", totalVolume: 1324000, accuracyRate: 97.5, employeesCount: 220, issuesResolved: 29, taxAdjusted: 7600 },
      // 2024 runs
      { id: "hist-2024-06", year: 2024, month: "June", totalVolume: 1350000, accuracyRate: 98.2, employeesCount: 232, issuesResolved: 18, taxAdjusted: 5200 },
      { id: "hist-2024-12", year: 2024, month: "December", totalVolume: 1380500, accuracyRate: 98.9, employeesCount: 238, issuesResolved: 15, taxAdjusted: 4100 },
      // 2025 runs
      { id: "hist-2025-06", year: 2025, month: "June", totalVolume: 1395000, accuracyRate: 99.4, employeesCount: 242, issuesResolved: 8, taxAdjusted: 1800 },
      { id: "hist-2025-12", year: 2025, month: "December", totalVolume: 1412000, accuracyRate: 99.7, employeesCount: 246, issuesResolved: 4, taxAdjusted: 950 }
    ];

    for (const run of historicalRuns) {
      await setDoc(doc(db, "HistoricalPayroll", run.id), run);
    }

    // Log the historical data upload audit trail
    await setDoc(doc(db, "AuditLogs", `aud-hist-${Date.now()}`), {
      timestamp: new Date().toISOString(),
      user: "Ronak Surve (Super Admin)",
      role: "Super Admin",
      action: "Seeded 5-Year Corporate Historic Payroll Run Data",
      details: "Loaded aggregate runs from 2021 to 2025 into HistoricalPayroll. Seeding complete (20 monthly cycle trends generated)."
    });

    console.log("Historical database seeded successfully!");
  } catch (err) {
    console.error("Error during historical database seed:", err);
  }
}
