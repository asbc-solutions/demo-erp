export type ProjectTypeId =
  | "external-client"
  | "internal-initiative"
  | "capital"
  | "overhead"
  | "rnd"
  | "compliance"

export type ProjectTypeOption = {
  id: ProjectTypeId
  label: string
  description: string
  icon: "briefcase" | "building" | "landmark" | "layers" | "sparkles" | "shield"
}

export const PROJECT_TYPES: ProjectTypeOption[] = [
  {
    id: "external-client",
    label: "External Client",
    description: "Customer-billed engagement",
    icon: "briefcase",
  },
  {
    id: "internal-initiative",
    label: "Internal Initiative",
    description: "Cross-team program",
    icon: "building",
  },
  {
    id: "capital",
    label: "Capital (CAPEX)",
    description: "Asset under construction",
    icon: "landmark",
  },
  {
    id: "overhead",
    label: "Overhead",
    description: "Indirect operating cost",
    icon: "layers",
  },
  {
    id: "rnd",
    label: "R&D",
    description: "Discovery / experimentation",
    icon: "sparkles",
  },
  {
    id: "compliance",
    label: "Compliance",
    description: "Regulatory or audit",
    icon: "shield",
  },
]

export type BillingMethod = "Fixed Price" | "Time & Materials" | "Milestone"

export const BILLING_METHODS: BillingMethod[] = [
  "Fixed Price",
  "Time & Materials",
  "Milestone",
]

export type ProjectPriority = "Low" | "Medium" | "High" | "Critical"

export const PROJECT_PRIORITIES: ProjectPriority[] = [
  "Low",
  "Medium",
  "High",
  "Critical",
]

export type WbsLevel = "L1" | "L2" | "L3"

export const WBS_LEVEL_STYLE: Record<WbsLevel, string> = {
  L1: "bg-brand-primary/12 text-brand-primary",
  L2: "bg-brand-info/12 text-brand-info",
  L3: "bg-brand-success/12 text-brand-success",
}

export type WbsNode = {
  id: string
  level: WbsLevel
  label: string
  indent: number
}

export const WBS_SKELETON: WbsNode[] = [
  { id: "wbs-1", level: "L1", label: "Project", indent: 0 },
  { id: "wbs-2", level: "L2", label: "Phase 1 — Discovery", indent: 1 },
  { id: "wbs-3", level: "L3", label: "Site Survey", indent: 2 },
  { id: "wbs-4", level: "L3", label: "Stakeholder Workshops", indent: 2 },
  { id: "wbs-5", level: "L2", label: "Phase 2 — Build", indent: 1 },
  { id: "wbs-6", level: "L3", label: "Implementation", indent: 2 },
  { id: "wbs-7", level: "L2", label: "Phase 3 — Handover", indent: 1 },
]

export type StakeholderAvatarColor =
  | "indigo"
  | "amber"
  | "emerald"
  | "violet"
  | "muted"

export const STAKEHOLDER_AVATAR_STYLE: Record<StakeholderAvatarColor, string> = {
  indigo: "bg-brand-primary text-white",
  amber: "bg-brand-warning text-white",
  emerald: "bg-brand-success text-white",
  violet: "bg-brand-info text-white",
  muted: "bg-content-lightest text-white",
}

export type StakeholderRole = {
  id: string
  role: string
  required?: boolean
  name?: string
  initials: string
  color: StakeholderAvatarColor
  notifyDefault: boolean
}

export const STAKEHOLDER_ROLES: StakeholderRole[] = [
  {
    id: "pm",
    role: "Project Manager",
    required: true,
    name: "Anna Mostafa",
    initials: "AM",
    color: "indigo",
    notifyDefault: true,
  },
  {
    id: "sponsor",
    role: "Sponsor",
    name: "Omar Sami",
    initials: "OS",
    color: "amber",
    notifyDefault: true,
  },
  {
    id: "finance",
    role: "Finance Controller",
    name: "Rana Khalil",
    initials: "RK",
    color: "emerald",
    notifyDefault: true,
  },
  {
    id: "customer",
    role: "Customer Contact",
    initials: "?",
    color: "muted",
    notifyDefault: false,
  },
  {
    id: "lead",
    role: "Team Lead",
    name: "Lotfy Hassan",
    initials: "LH",
    color: "violet",
    notifyDefault: false,
  },
]

export type WorkingDay = {
  id: string
  label: string
}

export const WORKING_DAYS: WorkingDay[] = [
  { id: "mon", label: "Mon" },
  { id: "tue", label: "Tue" },
  { id: "wed", label: "Wed" },
  { id: "thu", label: "Thu" },
  { id: "fri", label: "Fri" },
  { id: "sat", label: "Sat" },
  { id: "sun", label: "Sun" },
]

export const DEFAULT_WORKING_DAYS = ["mon", "tue", "wed", "thu", "fri"]

export const TIMEZONES = [
  "Egypt Standard (GMT+2)",
  "Gulf Standard (GMT+4)",
  "Central European (GMT+1)",
  "Eastern (GMT-5)",
]

export const WIZARD_STEPS = [
  { id: "classification", label: "Classification" },
  { id: "details", label: "Details" },
  { id: "hierarchy", label: "Hierarchy" },
  { id: "stakeholders", label: "Stakeholders" },
  { id: "calendar", label: "Calendar" },
  { id: "review", label: "Review" },
] as const

export type WizardStepId = (typeof WIZARD_STEPS)[number]["id"]

/** Backend `project_type` enum (CHECK-constrained). */
export type ApiProjectType = "internal" | "external" | "capital" | "overhead"

/** Maps a wizard classification card to the backend `project_type`. */
export const PROJECT_TYPE_TO_API: Record<ProjectTypeId, ApiProjectType> = {
  "external-client": "external",
  "internal-initiative": "internal",
  capital: "capital",
  overhead: "overhead",
  // No dedicated backend enum yet — treated as internal initiatives.
  rnd: "internal",
  compliance: "internal",
}

export type ProjectClassification = "strategic" | "operational"

export type NewProjectForm = {
  type: ProjectTypeId
  billingMethod: BillingMethod
  name: string
  code: string
  description: string
  priority: ProjectPriority
  classification: ProjectClassification
  managerId: string
  branchId: string
  costCentreId: string
  currencyCode: string
  budgetAmount: string
  startDate: string
  endDate: string
  calendarName: string
  timezone: string
  workingDays: string[]
  startOfDay: string
  endOfDay: string
  notify: Record<string, boolean>
}

export const INITIAL_PROJECT_FORM: NewProjectForm = {
  type: "external-client",
  billingMethod: "Fixed Price",
  name: "",
  code: "PRJ-2025-007",
  description: "",
  priority: "High",
  classification: "operational",
  managerId: "",
  branchId: "",
  costCentreId: "",
  currencyCode: "EGP",
  budgetAmount: "",
  startDate: "2025-07-01",
  endDate: "2026-04-30",
  calendarName: "Egypt Standard",
  timezone: "Egypt Standard (GMT+2)",
  workingDays: DEFAULT_WORKING_DAYS,
  startOfDay: "08:00",
  endOfDay: "17:00",
  notify: Object.fromEntries(
    STAKEHOLDER_ROLES.map((s) => [s.id, s.notifyDefault]),
  ),
}

