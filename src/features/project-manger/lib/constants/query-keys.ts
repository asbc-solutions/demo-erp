import type {
  ProjectListParams,
  MyProjectsParams,
  MyMilestonesParams,
  TemplateListParams,
  ResourceListParams,
  TaskListParams,
  MessageListParams,
  ActivityFeedParams,
  DocumentLibraryParams,
  ResourcePeriodParams,
  BudgetScopeParams,
  InventoryScopeParams,
  MaterialTab,
  ExpenseListParams,
} from "../types"

export const pmKeys = {
  projects: {
    all: ["pm", "projects"] as const,
    list: (params?: ProjectListParams) =>
      [...pmKeys.projects.all, "list", params] as const,
    detail: (id: string) => [...pmKeys.projects.all, "detail", id] as const,
    stakeholders: (id: string) =>
      [...pmKeys.projects.all, id, "stakeholders"] as const,
    stats: () => [...pmKeys.projects.all, "stats"] as const,
  },

  myWork: {
    all: ["pm", "my-work"] as const,
    summary: () => [...pmKeys.myWork.all, "summary"] as const,
    priorities: (date?: string) =>
      [...pmKeys.myWork.all, "priorities", date] as const,
    capacity: (weekStart?: string) =>
      [...pmKeys.myWork.all, "capacity", weekStart] as const,
    projects: (params?: MyProjectsParams) =>
      [...pmKeys.myWork.all, "projects", params] as const,
    activity: (limit?: number) =>
      [...pmKeys.myWork.all, "activity", limit] as const,
    projectsStats: () => [...pmKeys.myWork.all, "projects-stats"] as const,
    milestones: (params?: MyMilestonesParams) =>
      [...pmKeys.myWork.all, "milestones", params] as const,
  },

  templates: {
    all: ["pm", "templates"] as const,
    list: (params?: TemplateListParams) =>
      [...pmKeys.templates.all, "list", params] as const,
    detail: (id: string) => [...pmKeys.templates.all, "detail", id] as const,
  },

  hierarchy: {
    all: ["pm", "hierarchy"] as const,
    wbsIndex: () => [...pmKeys.hierarchy.all, "wbs-index"] as const,
    byProject: (projectId: string) =>
      [...pmKeys.hierarchy.all, "project", projectId] as const,
    timelineRollup: (timelineId: string) =>
      [...pmKeys.hierarchy.all, "timeline", timelineId, "rollup"] as const,
    phaseRollup: (phaseId: string) =>
      [...pmKeys.hierarchy.all, "phase", phaseId, "rollup"] as const,
    taskRollup: (taskId: string) =>
      [...pmKeys.hierarchy.all, "task", taskId, "rollup"] as const,
  },

  scheduling: {
    all: ["pm", "scheduling"] as const,
    portfolio: (params?: unknown) =>
      [...pmKeys.scheduling.all, "portfolio", params] as const,
    milestones: (projectId: string) =>
      [...pmKeys.scheduling.all, "milestones", projectId] as const,
    milestone: (id: string) =>
      [...pmKeys.scheduling.all, "milestone", id] as const,
    baselines: (projectId: string) =>
      [...pmKeys.scheduling.all, "baselines", projectId] as const,
    baseline: (id: string) =>
      [...pmKeys.scheduling.all, "baseline", id] as const,
    dependencies: (taskId: string) =>
      [...pmKeys.scheduling.all, "dependencies", taskId] as const,
    criticalPath: (projectId: string) =>
      [...pmKeys.scheduling.all, "critical-path", projectId] as const,
  },

  resources: {
    all: ["pm", "resources"] as const,
    list: (params?: ResourceListParams) =>
      [...pmKeys.resources.all, "list", params] as const,
    summary: (params?: ResourcePeriodParams) =>
      [...pmKeys.resources.all, "summary", params] as const,
    heatmap: (params?: ResourcePeriodParams) =>
      [...pmKeys.resources.all, "heatmap", params] as const,
    profile: (employeeId: string) =>
      [...pmKeys.resources.all, "profile", employeeId] as const,
    capacity: (employeeId: string, from: string, to: string) =>
      [...pmKeys.resources.all, "capacity", employeeId, from, to] as const,
    utilization: (projectId: string) =>
      [...pmKeys.resources.all, "utilization", projectId] as const,
  },

  tasks: {
    all: ["pm", "tasks"] as const,
    people: (ids: string[]) => ["pm", "people", ids] as const,
    list: (params?: TaskListParams) =>
      [...pmKeys.tasks.all, "list", params] as const,
    assignees: (taskId: string) =>
      [...pmKeys.tasks.all, "assignees", taskId] as const,
    workload: (employeeId: string) =>
      [...pmKeys.tasks.all, "workload", employeeId] as const,
  },

  documents: {
    all: ["pm", "documents"] as const,
    library: (params?: DocumentLibraryParams) =>
      [...pmKeys.documents.all, "library", params] as const,
    forNode: (nodeId: string) =>
      [...pmKeys.documents.all, "node", nodeId] as const,
    detail: (id: string) => [...pmKeys.documents.all, "detail", id] as const,
    versions: (id: string) =>
      [...pmKeys.documents.all, "versions", id] as const,
  },

  costBudget: {
    all: ["pm", "cost-budget"] as const,
    dashboard: (params?: BudgetScopeParams) =>
      [...pmKeys.costBudget.all, "dashboard", params] as const,
    costMix: (params?: BudgetScopeParams) =>
      [...pmKeys.costBudget.all, "cost-mix", params] as const,
    waterfall: (params?: BudgetScopeParams) =>
      [...pmKeys.costBudget.all, "waterfall", params] as const,
    budgets: (projectId: string) =>
      [...pmKeys.costBudget.all, "budgets", projectId] as const,
    evm: (projectId: string) =>
      [...pmKeys.costBudget.all, "evm", projectId] as const,
    costPlans: (nodeId: string) =>
      [...pmKeys.costBudget.all, "cost-plans", nodeId] as const,
    nodeCost: (nodeId: string) =>
      [...pmKeys.costBudget.all, "node-cost", nodeId] as const,
    commitments: (nodeId: string) =>
      [...pmKeys.costBudget.all, "commitments", nodeId] as const,
  },

  reporting: {
    all: ["pm", "reporting"] as const,
    portfolio: () => [...pmKeys.reporting.all, "portfolio-dashboard"] as const,
  },

  governance: {
    all: ["pm", "governance"] as const,
    gates: (projectId: string) =>
      [...pmKeys.governance.all, "gates", projectId] as const,
    changeRequests: (projectId: string) =>
      [...pmKeys.governance.all, "change-requests", projectId] as const,
    closure: (projectId: string) =>
      [...pmKeys.governance.all, "closure", projectId] as const,
  },

  billing: {
    all: ["pm", "billing"] as const,
    portfolioRevenue: () =>
      [...pmKeys.billing.all, "portfolio-revenue"] as const,
    portfolioMilestones: () =>
      [...pmKeys.billing.all, "portfolio-milestones"] as const,
    portfolioInvoices: () =>
      [...pmKeys.billing.all, "portfolio-invoices"] as const,
    plan: (projectId: string) =>
      [...pmKeys.billing.all, "plan", projectId] as const,
    revenue: (projectId: string) =>
      [...pmKeys.billing.all, "revenue", projectId] as const,
    milestones: (projectId: string) =>
      [...pmKeys.billing.all, "milestones", projectId] as const,
    invoices: (projectId: string) =>
      [...pmKeys.billing.all, "invoices", projectId] as const,
  },

  timeExpense: {
    all: ["pm", "time-expense"] as const,
    timesheet: (employeeId: string, weekStart: string) =>
      [...pmKeys.timeExpense.all, "timesheet", employeeId, weekStart] as const,
    expenses: (params?: ExpenseListParams) =>
      [...pmKeys.timeExpense.all, "expenses", params] as const,
    categories: () =>
      [...pmKeys.timeExpense.all, "expense-categories"] as const,
  },

  inventory: {
    all: ["pm", "inventory"] as const,
    summary: (params?: InventoryScopeParams) =>
      [...pmKeys.inventory.all, "summary", params] as const,
    materials: (projectId: string, tab: MaterialTab) =>
      [...pmKeys.inventory.all, "materials", projectId, tab] as const,
  },

  collaboration: {
    all: ["pm", "collaboration"] as const,
    portfolioActivity: (limit?: number) =>
      [...pmKeys.collaboration.all, "portfolio-activity", limit] as const,
    context: (projectId?: string) =>
      [...pmKeys.collaboration.all, "context", projectId] as const,
    messagesAll: (nodeId: string) =>
      [...pmKeys.collaboration.all, "messages", nodeId] as const,
    messages: (nodeId: string, params?: MessageListParams) =>
      [...pmKeys.collaboration.all, "messages", nodeId, params] as const,
    activity: (projectId: string, params?: ActivityFeedParams) =>
      [...pmKeys.collaboration.all, "activity", projectId, params] as const,
    search: (projectId: string, q: string) =>
      [...pmKeys.collaboration.all, "search", projectId, q] as const,
  },
}
