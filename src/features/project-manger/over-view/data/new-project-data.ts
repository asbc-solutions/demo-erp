import type { Messages } from "next-intl"

type NewProjectMessages = Messages["ProjectsNewProject"]

/** A flat (string) message key of the `ProjectsNewProject` namespace. */
export type NewProjectKey = {
  [K in keyof NewProjectMessages]: NewProjectMessages[K] extends string ? K : never
}[keyof NewProjectMessages]

export type ProjectTypeId =
  | "external-client"
  | "internal-initiative"
  | "capital"
  | "overhead"
  | "rnd"
  | "compliance"

export type ProjectTypeOption = {
  id: ProjectTypeId
  labelKey: NewProjectKey
  descriptionKey: NewProjectKey
  icon: "briefcase" | "building" | "landmark" | "layers" | "sparkles" | "shield"
}

export const PROJECT_TYPES: ProjectTypeOption[] = [
  {
    id: "external-client",
    labelKey: "typeExternalClient",
    descriptionKey: "typeExternalClientDescription",
    icon: "briefcase",
  },
  {
    id: "internal-initiative",
    labelKey: "typeInternalInitiative",
    descriptionKey: "typeInternalInitiativeDescription",
    icon: "building",
  },
  {
    id: "capital",
    labelKey: "typeCapital",
    descriptionKey: "typeCapitalDescription",
    icon: "landmark",
  },
  {
    id: "overhead",
    labelKey: "typeOverhead",
    descriptionKey: "typeOverheadDescription",
    icon: "layers",
  },
  {
    id: "rnd",
    labelKey: "typeRnd",
    descriptionKey: "typeRndDescription",
    icon: "sparkles",
  },
  {
    id: "compliance",
    labelKey: "typeCompliance",
    descriptionKey: "typeComplianceDescription",
    icon: "shield",
  },
]

export type BillingMethod = "Fixed Price" | "Time & Materials" | "Milestone"

export const BILLING_METHODS: BillingMethod[] = [
  "Fixed Price",
  "Time & Materials",
  "Milestone",
]

/** Billing method → `ProjectsNewProject` message key. */
export const BILLING_METHOD_KEY = {
  "Fixed Price": "billingFixedPrice",
  "Time & Materials": "billingTimeMaterials",
  Milestone: "billingMilestone",
} as const satisfies Record<BillingMethod, NewProjectKey>

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
  labelKey: NewProjectKey
  indent: number
}

export const WBS_SKELETON: WbsNode[] = [
  { id: "wbs-1", level: "L1", labelKey: "wbsProject", indent: 0 },
  { id: "wbs-2", level: "L2", labelKey: "wbsPhaseDiscovery", indent: 1 },
  { id: "wbs-3", level: "L3", labelKey: "wbsSiteSurvey", indent: 2 },
  { id: "wbs-4", level: "L3", labelKey: "wbsWorkshops", indent: 2 },
  { id: "wbs-5", level: "L2", labelKey: "wbsPhaseBuild", indent: 1 },
  { id: "wbs-6", level: "L3", labelKey: "wbsImplementation", indent: 2 },
  { id: "wbs-7", level: "L2", labelKey: "wbsPhaseHandover", indent: 1 },
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
  roleKey: NewProjectKey
  required?: boolean
  name?: string
  initials: string
  color: StakeholderAvatarColor
  notifyDefault: boolean
}

export const STAKEHOLDER_ROLES: StakeholderRole[] = [
  {
    id: "pm",
    roleKey: "roleProjectManager",
    required: true,
    name: "Anna Mostafa",
    initials: "AM",
    color: "indigo",
    notifyDefault: true,
  },
  {
    id: "sponsor",
    roleKey: "roleSponsor",
    name: "Omar Sami",
    initials: "OS",
    color: "amber",
    notifyDefault: true,
  },
  {
    id: "finance",
    roleKey: "roleFinanceController",
    name: "Rana Khalil",
    initials: "RK",
    color: "emerald",
    notifyDefault: true,
  },
  {
    id: "customer",
    roleKey: "roleCustomerContact",
    initials: "?",
    color: "muted",
    notifyDefault: false,
  },
  {
    id: "lead",
    roleKey: "roleTeamLead",
    name: "Lotfy Hassan",
    initials: "LH",
    color: "violet",
    notifyDefault: false,
  },
]

/** Working-day ids; each is a `ProjectsNewProject.weekday` message key. */
export const WORKING_DAYS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const

export type WorkingDayId = (typeof WORKING_DAYS)[number]

export const DEFAULT_WORKING_DAYS = ["mon", "tue", "wed", "thu", "fri"]

/** Form value (kept as-is) → display label key. */
export const TIMEZONES: { value: string; labelKey: NewProjectKey }[] = [
  { value: "Egypt Standard (GMT+2)", labelKey: "tzEgypt" },
  { value: "Gulf Standard (GMT+4)", labelKey: "tzGulf" },
  { value: "Central European (GMT+1)", labelKey: "tzCentralEurope" },
  { value: "Eastern (GMT-5)", labelKey: "tzEastern" },
]

export const WIZARD_STEPS = [
  { id: "classification", labelKey: "stepClassification" },
  { id: "details", labelKey: "stepDetails" },
  { id: "hierarchy", labelKey: "stepHierarchy" },
  { id: "stakeholders", labelKey: "stepStakeholders" },
  { id: "calendar", labelKey: "stepCalendar" },
  { id: "review", labelKey: "stepReview" },
] as const satisfies readonly { id: string; labelKey: NewProjectKey }[]

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

