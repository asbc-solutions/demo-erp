export const REPORT_DEPARTMENT_OPTIONS = [
  { id: "all", label: "All Departments" },
  { id: "engineering", label: "Engineering" },
  { id: "operations", label: "Operations" },
  { id: "sales", label: "Sales" },
  { id: "marketing", label: "Marketing" },
  { id: "hr", label: "Human Resources" },
  { id: "finance", label: "Finance" },
] as const

export const MOCK_HEADCOUNT_STATS = {
  total: 248,
  totalDelta: "+3 vs last month",
  fullTime: 210,
  fullTimePct: "84.7% of workforce",
  partTime: 20,
  partTimePct: "8.1% of workforce",
  contractors: 18,
  contractorsPct: "7.3% of workforce",
}

export const MOCK_NEW_HIRES_TERMINATIONS = [
  { month: "Jun 2025", hires: 14, terminations: 5 },
  { month: "Jul 2025", hires: 11, terminations: 7 },
  { month: "Aug 2025", hires: 18, terminations: 4 },
  { month: "Sep 2025", hires: 9, terminations: 8 },
  { month: "Oct 2025", hires: 16, terminations: 6 },
  { month: "Nov 2025", hires: 12, terminations: 5 },
  { month: "Dec 2025", hires: 15, terminations: 4 },
  { month: "Jan 2026", hires: 10, terminations: 7 },
  { month: "Feb 2026", hires: 13, terminations: 5 },
  { month: "Mar 2026", hires: 17, terminations: 6 },
  { month: "Apr 2026", hires: 14, terminations: 4 },
] as const

export const MOCK_ATTRITION_STATS = {
  rate: "3.6%",
  rateDelta: "+0.4% vs last month",
  voluntary: 5,
  involuntary: 4,
  avgTenureYears: "1.8 yrs",
}

export const MOCK_ATTRITION_TREND = [
  { month: "Jun 2025", rate: 3.1 },
  { month: "Jul 2025", rate: 2.9 },
  { month: "Aug 2025", rate: 3.2 },
  { month: "Sep 2025", rate: 3.4 },
  { month: "Oct 2025", rate: 3.0 },
  { month: "Nov 2025", rate: 3.3 },
  { month: "Dec 2025", rate: 3.5 },
  { month: "Jan 2026", rate: 3.2 },
  { month: "Feb 2026", rate: 3.6 },
  { month: "Mar 2026", rate: 3.4 },
  { month: "Apr 2026", rate: 3.6 },
] as const

export const MOCK_REPORT_SALARY_STATS = {
  totalPayrollLabel: "5.8M EGP",
  payrollDelta: "+2.3% vs last month",
  avgSalary: "25,199 EGP",
  highestDeptAvg: "30,000 EGP",
  highestDeptName: "Engineering",
  momChange: "+2.3%",
  momDescription: "Month over month",
}

export const MOCK_REPORT_SALARY_BY_DEPT = [
  { id: "d1", department: "Engineering", totalCost: 1_420_000, color: "indigo" as const },
  { id: "d2", department: "Operations", totalCost: 1_380_000, color: "emerald" as const },
  { id: "d3", department: "Sales", totalCost: 720_000, color: "amber" as const },
  { id: "d4", department: "Marketing", totalCost: 480_000, color: "rose" as const },
  { id: "d5", department: "Human Resources", totalCost: 310_000, color: "violet" as const },
  { id: "d6", department: "Finance", totalCost: 290_000, color: "blue" as const },
]

export const MOCK_DOCUMENT_COMPLIANCE_STATS = {
  total: 45,
  compliant: 32,
  compliantPct: "71.1% of total",
  expiring: 8,
  expired: 3,
}

export const MOCK_DOCUMENT_COMPLIANCE_PIE = [
  { key: "compliant", label: "Compliant", amount: 32, color: "#10b981" },
  { key: "expiring", label: "Expiring soon", amount: 8, color: "#f59e0b" },
  { key: "expired", label: "Expired", amount: 3, color: "#ef4444" },
  { key: "missing", label: "Missing", amount: 2, color: "#a1a1aa" },
] as const
