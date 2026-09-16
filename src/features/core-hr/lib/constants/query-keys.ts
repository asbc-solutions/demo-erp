import type {
  BranchListParams,
  DeptListParams,
  JobGradeListParams,
  JobListParams,
  CostCenterListParams,
  AccountingSalaryListParams,
  EmployeeListParams,
  PositionListParams,
  ContractListParams,
  DocumentListParams,
  ExpiringDocumentsParams,
  EmergencyContactListParams,
  ApprovalListParams,
  AuditLogListParams,
  HeadcountParams,
  AttritionParams,
  SalaryCostParams,
  DocumentComplianceParams,
  TenureParams,
  NotificationListParams,
  LeaveTypeListParams,
  LeavePolicyListParams,
  MyLeaveRequestsParams,
  PendingLeaveRequestsParams,
  KpiListParams,
  MyGoalsParams,
  MyAppraisalsParams,
  ReviewCycleListParams,
  TeamAppraisalsParams,
  ProgramListParams,
  CourseListParams,
  CertificationListParams,
  SkillListParams,
  SessionListParams,
} from "../types"

export const coreHrKeys = {
  // ─── Bruno-backed entities ──────────────────────────────────────────────────

  branches: {
    all: ["core-hr", "branches"] as const,
    list: (params?: BranchListParams) =>
      [...coreHrKeys.branches.all, "list", params] as const,
    detail: (id: string) => [...coreHrKeys.branches.all, "detail", id] as const,
    departments: (branchId: string) =>
      [...coreHrKeys.branches.all, branchId, "departments"] as const,
    headcount: (branchId: string) =>
      [...coreHrKeys.branches.all, branchId, "headcount"] as const,
    hierarchy: (branchId: string) =>
      [...coreHrKeys.branches.all, branchId, "hierarchy"] as const,
  },

  departments: {
    all: ["core-hr", "departments"] as const,
    list: (params?: DeptListParams) =>
      [...coreHrKeys.departments.all, "list", params] as const,
    detail: (id: string) =>
      [...coreHrKeys.departments.all, "detail", id] as const,
    positions: (deptId: string) =>
      [...coreHrKeys.departments.all, deptId, "positions"] as const,
    tree: (deptId: string) =>
      [...coreHrKeys.departments.all, deptId, "tree"] as const,
  },

  jobGrades: {
    all: ["core-hr", "job-grades"] as const,
    list: (params?: JobGradeListParams) =>
      [...coreHrKeys.jobGrades.all, "list", params] as const,
    detail: (id: string) =>
      [...coreHrKeys.jobGrades.all, "detail", id] as const,
  },

  jobs: {
    all: ["core-hr", "jobs"] as const,
    list: (params?: JobListParams) =>
      [...coreHrKeys.jobs.all, "list", params] as const,
    detail: (id: string) => [...coreHrKeys.jobs.all, "detail", id] as const,
    families: () => [...coreHrKeys.jobs.all, "families"] as const,
  },

  costCenters: {
    all: ["core-hr", "cost-centers"] as const,
    list: (params: CostCenterListParams) =>
      [...coreHrKeys.costCenters.all, "list", params] as const,
    detail: (id: string) =>
      [...coreHrKeys.costCenters.all, "detail", id] as const,
    hierarchy: (id: string) =>
      [...coreHrKeys.costCenters.all, id, "hierarchy"] as const,
    salarySummary: (id: string) =>
      [...coreHrKeys.costCenters.all, id, "salary-summary"] as const,
  },

  accountingSalary: {
    all: ["core-hr", "accounting-salary"] as const,
    list: (params?: AccountingSalaryListParams) =>
      [...coreHrKeys.accountingSalary.all, "list", params] as const,
    detail: (id: string) =>
      [...coreHrKeys.accountingSalary.all, "detail", id] as const,
  },

  // ─── Pending Bruno endpoints ────────────────────────────────────────────────

  employees: {
    all: ["core-hr", "employees"] as const,
    list: (params?: EmployeeListParams) =>
      [...coreHrKeys.employees.all, "list", params] as const,
    detail: (id: string) =>
      [...coreHrKeys.employees.all, "detail", id] as const,
    directReports: (id: string) =>
      [...coreHrKeys.employees.all, id, "direct-reports"] as const,
    orgChart: (id: string) =>
      [...coreHrKeys.employees.all, id, "org-chart"] as const,
  },

  positions: {
    all: ["core-hr", "positions"] as const,
    list: (params?: PositionListParams) =>
      [...coreHrKeys.positions.all, "list", params] as const,
    detail: (id: string) =>
      [...coreHrKeys.positions.all, "detail", id] as const,
  },

  salaries: {
    all: ["core-hr", "salaries"] as const,
    analytics: () => [...coreHrKeys.salaries.all, "analytics"] as const,
    history: (employeeId: string) =>
      [...coreHrKeys.salaries.all, "employee", employeeId, "history"] as const,
    current: (employeeId: string) =>
      [...coreHrKeys.salaries.all, "employee", employeeId, "current"] as const,
  },

  contracts: {
    all: ["core-hr", "contracts"] as const,
    list: (params?: ContractListParams) =>
      [...coreHrKeys.contracts.all, "list", params] as const,
    detail: (id: string) =>
      [...coreHrKeys.contracts.all, "detail", id] as const,
    expiring: (days: number) =>
      [...coreHrKeys.contracts.all, "expiring", days] as const,
    byEmployee: (employeeId: string) =>
      [...coreHrKeys.contracts.all, "employee", employeeId] as const,
    currentByEmployee: (employeeId: string) =>
      [...coreHrKeys.contracts.all, "employee", employeeId, "current"] as const,
    document: (employeeId: string, contractId: string) =>
      [
        ...coreHrKeys.contracts.all,
        "employee",
        employeeId,
        contractId,
        "document",
      ] as const,
  },

  documents: {
    all: ["core-hr", "documents"] as const,
    list: (params?: DocumentListParams) =>
      [...coreHrKeys.documents.all, "list", params] as const,
    byEmployee: (employeeId: string) =>
      [...coreHrKeys.documents.all, "employee", employeeId] as const,
    expiring: (params?: ExpiringDocumentsParams) =>
      [...coreHrKeys.documents.all, "expiring", params] as const,
    download: (employeeId: string, documentId: string) =>
      [
        ...coreHrKeys.documents.all,
        "employee",
        employeeId,
        documentId,
        "download",
      ] as const,
  },

  emergencyContacts: {
    all: ["core-hr", "emergency-contacts"] as const,
    list: (params?: EmergencyContactListParams) =>
      [...coreHrKeys.emergencyContacts.all, "list", params] as const,
    byEmployee: (employeeId: string) =>
      [...coreHrKeys.emergencyContacts.all, "employee", employeeId] as const,
  },

  approvals: {
    all: ["core-hr", "approvals"] as const,
    list: (params?: ApprovalListParams) =>
      [...coreHrKeys.approvals.all, "list", params] as const,
    pendingForMe: () =>
      [...coreHrKeys.approvals.all, "pending-for-me"] as const,
    detail: (id: string) =>
      [...coreHrKeys.approvals.all, "detail", id] as const,
  },

  auditLog: {
    all: ["core-hr", "audit-log"] as const,
    list: (params?: AuditLogListParams) =>
      [...coreHrKeys.auditLog.all, "list", params] as const,
  },

  reports: {
    all: ["core-hr", "reports"] as const,
    kpi: () => [...coreHrKeys.reports.all, "kpi"] as const,
    headcount: (params?: HeadcountParams) =>
      [...coreHrKeys.reports.all, "headcount", params] as const,
    attrition: (params?: AttritionParams) =>
      [...coreHrKeys.reports.all, "attrition", params] as const,
    salaryCost: (params?: SalaryCostParams) =>
      [...coreHrKeys.reports.all, "salary-cost", params] as const,
    documentCompliance: (params?: DocumentComplianceParams) =>
      [...coreHrKeys.reports.all, "document-compliance", params] as const,
    tenure: (params?: TenureParams) =>
      [...coreHrKeys.reports.all, "tenure", params] as const,
  },

  notifications: {
    all: ["core-hr", "notifications"] as const,
    list: (params?: NotificationListParams) =>
      [...coreHrKeys.notifications.all, "list", params] as const,
  },

  permissions: {
    all: ["core-hr", "permissions"] as const,
    me: () => [...coreHrKeys.permissions.all, "me"] as const,
  },

  // ─── Leave ──────────────────────────────────────────────────────────────────

  leaveTypes: {
    all: ["core-hr", "leave-types"] as const,
    list: (params?: LeaveTypeListParams) =>
      [...coreHrKeys.leaveTypes.all, "list", params] as const,
    detail: (id: string) =>
      [...coreHrKeys.leaveTypes.all, "detail", id] as const,
  },

  leavePolicies: {
    all: ["core-hr", "leave-policies"] as const,
    list: (params?: LeavePolicyListParams) =>
      [...coreHrKeys.leavePolicies.all, "list", params] as const,
  },

  leaveBalances: {
    all: ["core-hr", "leave-balances"] as const,
    me: (year?: number) => [...coreHrKeys.leaveBalances.all, "me", year] as const,
    byEmployee: (employeeId: string, year?: number) =>
      [...coreHrKeys.leaveBalances.all, "employee", employeeId, year] as const,
  },

  leaveRequests: {
    all: ["core-hr", "leave-requests"] as const,
    mine: (params?: MyLeaveRequestsParams) =>
      [...coreHrKeys.leaveRequests.all, "mine", params] as const,
    pending: (params?: PendingLeaveRequestsParams) =>
      [...coreHrKeys.leaveRequests.all, "pending", params] as const,
    detail: (id: string) =>
      [...coreHrKeys.leaveRequests.all, "detail", id] as const,
  },

  // ─── Performance ──────────────────────────────────────────────────────────────

  performanceKpis: {
    all: ["core-hr", "performance", "kpis"] as const,
    list: (params?: KpiListParams) =>
      [...coreHrKeys.performanceKpis.all, "list", params] as const,
  },

  performanceGoals: {
    all: ["core-hr", "performance", "goals"] as const,
    mine: (params?: MyGoalsParams) =>
      [...coreHrKeys.performanceGoals.all, "mine", params] as const,
  },

  performanceAppraisals: {
    all: ["core-hr", "performance", "appraisals"] as const,
    mine: (params?: MyAppraisalsParams) =>
      [...coreHrKeys.performanceAppraisals.all, "mine", params] as const,
    byCycle: (cycleId: string, params?: TeamAppraisalsParams) =>
      [
        ...coreHrKeys.performanceAppraisals.all,
        "cycle",
        cycleId,
        params,
      ] as const,
  },

  performanceCycles: {
    all: ["core-hr", "performance", "cycles"] as const,
    list: (params?: ReviewCycleListParams) =>
      [...coreHrKeys.performanceCycles.all, "list", params] as const,
  },

  // ─── Training ─────────────────────────────────────────────────────────────────

  trainingPrograms: {
    all: ["core-hr", "training", "programs"] as const,
    list: (params?: ProgramListParams) =>
      [...coreHrKeys.trainingPrograms.all, "list", params] as const,
    detail: (id: string) =>
      [...coreHrKeys.trainingPrograms.all, "detail", id] as const,
  },

  trainingCourses: {
    all: ["core-hr", "training", "courses"] as const,
    list: (params?: CourseListParams) =>
      [...coreHrKeys.trainingCourses.all, "list", params] as const,
    detail: (id: string) =>
      [...coreHrKeys.trainingCourses.all, "detail", id] as const,
  },

  trainingSessions: {
    all: ["core-hr", "training", "sessions"] as const,
    list: (params?: SessionListParams) =>
      [...coreHrKeys.trainingSessions.all, "list", params] as const,
    detail: (id: string) =>
      [...coreHrKeys.trainingSessions.all, "detail", id] as const,
    feedbackSummary: (id: string) =>
      [...coreHrKeys.trainingSessions.all, id, "feedback-summary"] as const,
  },

  trainingCertifications: {
    all: ["core-hr", "training", "certifications"] as const,
    list: (params?: CertificationListParams) =>
      [...coreHrKeys.trainingCertifications.all, "list", params] as const,
    mine: () => [...coreHrKeys.trainingCertifications.all, "mine"] as const,
  },

  trainingSkills: {
    all: ["core-hr", "training", "skills"] as const,
    list: (params?: SkillListParams) =>
      [...coreHrKeys.trainingSkills.all, "list", params] as const,
    gapAnalysis: (employeeId: string, jobGradeId: string) =>
      [
        ...coreHrKeys.trainingSkills.all,
        "gap",
        employeeId,
        jobGradeId,
      ] as const,
  },
}
